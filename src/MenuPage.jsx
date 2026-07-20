import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient.js'

const PHONE = '96176704426' // country code + number, no + and no spaces

const T = {
  en: { tagline: '', removeLabel: 'Remove ingredients', extraLabel: 'Add extras',
        noteLabel: 'Special instructions', addToOrder: 'Add to cart', viewOrder: 'View order',
        total: 'Total', yourOrder: 'Your order', complete: 'Complete order via WhatsApp',
        empty: 'Your order is empty.', sending: 'Sending order...' },
  ar: { tagline: '', removeLabel: 'احذف مكونات', extraLabel: 'إضافات',
        noteLabel: 'ملاحظات خاصة', addToOrder: 'اضف إلى السلة', viewOrder:'السلة',
        total: 'المجموع', yourOrder: 'طلبك', complete: 'أكمل الطلب عبر واتساب',
        empty: 'طلبك فاضي.', sending: 'عم يرسل الطلب...' }
}

function fmt(n) {
  return 'LBP ' + Number(n).toLocaleString('en-US')
}

export default function MenuPage() {
  const [lang, setLang] = useState('en')
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [activeCat, setActiveCat] = useState(null)
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [modalItem, setModalItem] = useState(null)
  const [qty, setQty] = useState(1)
  const [removed, setRemoved] = useState([])
  const [extras, setExtras] = useState([])
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: cats } = await supabase.from('categories').select('*').order('sort_order')
      const { data: menuItems } = await supabase.from('menu_items').select('*').order('id')
      setCategories(cats || [])
      setItems(menuItems || [])
      if (cats && cats.length) setActiveCat(cats[0].id)
    }
    load()
  }, [])

  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  function openItem(item) {
    setModalItem(item)
    setQty(1)
    setRemoved([])
    setExtras([])
    setNote('')
  }

  function unitPrice(item, selectedExtras) {
    const extraSum = selectedExtras.reduce((s, e) => s + Number(e.price), 0)
    return Number(item.price) + extraSum
  }

  function addToCart() {
    const unit = unitPrice(modalItem, extras)
    setCart(c => [...c, {
      name: lang === 'ar' ? modalItem.name_ar : modalItem.name_en,
      qty,
      unit,
      removed: removed.map(r => r[lang === 'ar' ? 'ar' : 'en']),
      extras: extras.map(e => e[lang === 'ar' ? 'name_ar' : 'name_en']),
      note
    }])
    setModalItem(null)
  }

  const cartTotal = cart.reduce((s, l) => s + l.unit * l.qty, 0)
  const cartCount = cart.reduce((s, l) => s + l.qty, 0)

  async function checkout() {
    if (cart.length === 0) return
    setSending(true)
    const { error } = await supabase.from('orders').insert({
      items: cart,
      total: cartTotal,
      status: 'new'
    })
    setSending(false)
    if (error) {
      alert('Could not send the order, please try again.')
      console.error(error)
      return
    }
    let msg = (lang === 'ar' ? 'طلب جديد من الدوحة:\n\n' : 'New order from Al Dooha:\n\n')
    cart.forEach(line => {
      msg += `${line.qty}x ${line.name} - ${fmt(line.unit * line.qty)}\n`
      if (line.removed.length) msg += `  ${lang === 'ar' ? 'بدون' : 'No'}: ${line.removed.join(', ')}\n`
      if (line.extras.length) msg += `  ${lang === 'ar' ? 'إضافات' : 'Extras'}: ${line.extras.join(', ')}\n`
      if (line.note) msg += `  ${lang === 'ar' ? 'ملاحظة' : 'Note'}: ${line.note}\n`
    })
    msg += `\n${T[lang].total}: ${fmt(cartTotal)}`
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`, '_blank')
    setCart([])
    setCartOpen(false)
  }

  const itemsByCat = catId => items.filter(i => i.category_id === catId)

  return (
    <div dir={dir} lang={lang}>
      <div className="topbar">
    
        <div className="lang-toggle">
          <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
          <button className={lang === 'ar' ? 'active' : ''} onClick={() => setLang('ar')}>AR</button>
        </div>
      </div>

     <div className="hero">
        <img src="/logo.png" alt="Al Dooha" className="logo-img" />
        
      </div>


      <div className="tabs">
        {categories.map(cat => (
          <button key={cat.id} className={'tab' + (activeCat === cat.id ? ' active' : '')}
            onClick={() => setActiveCat(cat.id)}>
            {lang === 'ar' ? cat.name_ar : cat.name_en}
          </button>
        ))}
      </div>

      <div className="menu-wrap">
        {categories.filter(c => c.id === activeCat).map(cat => (
          <div key={cat.id}>
            <div className="cat-title">{lang === 'ar' ? cat.name_ar : cat.name_en}</div>
            <div className="grid">
              {itemsByCat(cat.id).map(item => (
                <div key={item.id} className="item-card">
                  <div className="item-name">{lang === 'ar' ? item.name_ar : item.name_en}</div>
                  <div className="item-desc">{lang === 'ar' ? item.desc_ar : item.desc_en}</div>
                  <div className="item-bottom">
                    <div className="item-price">{fmt(item.price)}</div>
                    <button className="add-btn" onClick={() => openItem(item)}>{T[lang].addToOrder}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {cartCount > 0 && (
        <button className="cart-fab" onClick={() => setCartOpen(true)}>
          🛒 {T[lang].viewOrder} · {fmt(cartTotal)}
          <span className="badge">{cartCount}</span>
        </button>
      )}

      {modalItem && (
        <div className="overlay show">
          <div className="sheet">
            <button className="sheet-close" onClick={() => setModalItem(null)}>✕</button>
            <h2>{lang === 'ar' ? modalItem.name_ar : modalItem.name_en}</h2>
            <p className="sub">{lang === 'ar' ? modalItem.desc_ar : modalItem.desc_en}</p>

            {modalItem.remove_options?.length > 0 && (
              <div className="opt-group">
                <h3>{T[lang].removeLabel}</h3>
                {modalItem.remove_options.map((ing, i) => (
                  <div className="opt-row" key={i}>
                    <label>
                      <input type="checkbox" onChange={e => {
                        setRemoved(r => e.target.checked ? [...r, ing] : r.filter(x => x !== ing))
                      }} />
                      {ing[lang]}
                    </label>
                  </div>
                ))}
              </div>
            )}

            {modalItem.extra_options?.length > 0 && (
              <div className="opt-group">
                <h3>{T[lang].extraLabel}</h3>
                {modalItem.extra_options.map((ex, i) => (
                  <div className="opt-row" key={i}>
                    <label>
                      <input type="checkbox" onChange={e => {
                        setExtras(list => e.target.checked ? [...list, ex] : list.filter(x => x !== ex))
                      }} />
                      {lang === 'ar' ? ex.name_ar : ex.name_en}
                    </label>
                    <span>+{fmt(ex.price)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="opt-group">
              <h3>{T[lang].noteLabel}</h3>
              <textarea value={note} onChange={e => setNote(e.target.value)} />
            </div>

            <div className="qty-row">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => q + 1)}>+</button>
            </div>

            <button className="confirm-btn" onClick={addToCart}>
              {T[lang].addToOrder} · {fmt(unitPrice(modalItem, extras) * qty)}
            </button>
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="overlay show">
          <div className="sheet">
            <button className="sheet-close" onClick={() => setCartOpen(false)}>✕</button>
            <h2>{T[lang].yourOrder}</h2>
            {cart.length === 0 ? (
              <div className="empty-note">{T[lang].empty}</div>
            ) : (
              cart.map((line, idx) => (
                <div className="cart-line" key={idx}>
                  <div className="info">
                    <div className="name">{line.qty}× {line.name}</div>
                    {(line.removed.length > 0 || line.extras.length > 0 || line.note) && (
                      <div className="mods">
                        {line.removed.length > 0 && `${lang === 'ar' ? 'بدون' : 'No'}: ${line.removed.join(', ')} `}
                        {line.extras.length > 0 && `${lang === 'ar' ? 'إضافات' : 'Extra'}: ${line.extras.join(', ')} `}
                        {line.note}
                      </div>
                    )}
                    <button className="remove" onClick={() => setCart(c => c.filter((_, i) => i !== idx))}>
                      {lang === 'ar' ? 'احذف' : 'Remove'}
                    </button>
                  </div>
                  <div className="price">{fmt(line.unit * line.qty)}</div>
                </div>
              ))
            )}
            <div className="cart-total"><span>{T[lang].total}</span><span>{fmt(cartTotal)}</span></div>
            <button className="confirm-btn" onClick={checkout} disabled={sending}>
              {sending ? T[lang].sending : T[lang].complete}
            </button>
          </div>
        </div>
      )}

      <footer className="credit">© 2026 Al Dooha</footer>
<a href={`https://wa.me/${PHONE}`} target="_blank" rel="noreferrer" className="whatsapp-fab">💬</a>
    </div>
  )
}
