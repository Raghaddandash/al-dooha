import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient.js'

function fmt(n) {
  return 'LBP ' + Number(n).toLocaleString('en-US')
}

export default function AdminPage() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [tab, setTab] = useState('orders')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess))
    return () => sub.subscription.unsubscribe()
  }, [])

  async function login(e) {
    e.preventDefault()
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError(error.message)
  }

  if (!session) {
    return (
      <div className="admin-panel">
        <h2>Admin login</h2>
        <form onSubmit={login}>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          {authError && <p style={{ color: 'var(--rust)', fontSize: 13 }}>{authError}</p>}
          <button className="confirm-btn" type="submit">Log in</button>
        </form>
        <p style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 16 }}>
          No account yet? Create one from your Supabase dashboard under Authentication → Users → Add user.
        </p>
      </div>
    )
  }

  return (
    <div className="admin-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Al Dooha admin</h2>
        <button className="add-btn" onClick={() => supabase.auth.signOut()}>Log out</button>
      </div>
      <div className="lang-toggle" style={{ marginBottom: 20 }}>
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>Orders</button>
        <button className={tab === 'menu' ? 'active' : ''} onClick={() => setTab('menu')}>Menu</button>
      </div>
      {tab === 'orders' ? <OrdersTab /> : <MenuTab />}
    </div>
  )
}

function OrdersTab() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
      setOrders(data || [])
    }
    load()

    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function setStatus(id, status) {
    await supabase.from('orders').update({ status }).eq('id', id)
  }

  return (
    <div>
      {orders.length === 0 && <p style={{ color: 'var(--muted)' }}>No orders yet.</p>}
      {orders.map(order => (
        <div key={order.id} className="admin-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>#{order.id} · {new Date(order.created_at).toLocaleString()}</strong>
            <span>{fmt(order.total)}</span>
          </div>
          <ul style={{ margin: '8px 0', paddingLeft: 18, fontSize: 13 }}>
            {order.items.map((line, i) => (
              <li key={i}>{line.qty}× {line.name}
                {line.removed?.length > 0 && ` — No ${line.removed.join(', ')}`}
                {line.extras?.length > 0 && ` — Extra ${line.extras.join(', ')}`}
                {line.note && ` — "${line.note}"`}
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 8 }}>
            {['new', 'preparing', 'done'].map(s => (
              <button key={s} className="add-btn"
                style={{ opacity: order.status === s ? 1 : 0.5 }}
                onClick={() => setStatus(order.id, s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function MenuTab() {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [catId, setCatId] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [descEn, setDescEn] = useState('')
  const [descAr, setDescAr] = useState('')
  const [price, setPrice] = useState('')

  async function load() {
    const { data: cats } = await supabase.from('categories').select('*').order('sort_order')
    const { data: menuItems } = await supabase.from('menu_items').select('*').order('id')
    setCategories(cats || [])
    setItems(menuItems || [])
    if (cats && cats.length && !catId) setCatId(cats[0].id)
  }

  useEffect(() => { load() }, [])

  async function addItem() {
    if (!nameEn || !price) { alert('Name and price are required.'); return }
    const { error } = await supabase.from('menu_items').insert({
      category_id: catId,
      name_en: nameEn, name_ar: nameAr || nameEn,
      desc_en: descEn, desc_ar: descAr || descEn,
      price: Number(price)
    })
    if (error) { alert(error.message); return }
    setNameEn(''); setNameAr(''); setDescEn(''); setDescAr(''); setPrice('')
    load()
  }

  async function deleteItem(id) {
    await supabase.from('menu_items').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <h3 style={{ color: 'var(--gold-soft)' }}>Add item</h3>
      <select value={catId} onChange={e => setCatId(e.target.value)}>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
      </select>
      <input placeholder="Name (English)" value={nameEn} onChange={e => setNameEn(e.target.value)} />
      <input placeholder="Name (Arabic)" value={nameAr} onChange={e => setNameAr(e.target.value)} />
      <input placeholder="Description (English)" value={descEn} onChange={e => setDescEn(e.target.value)} />
      <input placeholder="Description (Arabic)" value={descAr} onChange={e => setDescAr(e.target.value)} />
      <input placeholder="Price (LBP)" type="number" value={price} onChange={e => setPrice(e.target.value)} />
      <button className="confirm-btn" onClick={addItem} style={{ marginBottom: 24 }}>Add item</button>

      <h3 style={{ color: 'var(--gold-soft)' }}>Current items</h3>
      {items.map(item => (
        <div className="admin-row" key={item.id}>
          <span>{item.name_en} — {fmt(item.price)}</span>
          <button onClick={() => deleteItem(item.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
