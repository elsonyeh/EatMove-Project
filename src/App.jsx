import { useState } from 'react';
import './App.css';

export default function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('restaurants');
  const [favoriteRestaurants, setFavoriteRestaurants] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('全部');

  const openModal = () => setIsLoginModalOpen(true);
  const closeModal = () => setIsLoginModalOpen(false);

  const toggleFavorite = (restaurant) => {
    if (favoriteRestaurants.find((fav) => fav.name === restaurant.name)) {
      setFavoriteRestaurants(favoriteRestaurants.filter((fav) => fav.name !== restaurant.name));
    } else {
      setFavoriteRestaurants([...favoriteRestaurants, restaurant]);
    }
  };

  const addToCart = (restaurant) => {
    if (!cartItems.find((item) => item.name === restaurant.name)) {
      setCartItems([...cartItems, restaurant]);
    }
  };

  return (
    <div>
      <Header onLoginClick={openModal} onNavigate={setCurrentPage} />
      <main className="container">
        {currentPage === 'restaurants' && (
          <>
            <Hero />
            <Categories onSelectCategory={setSelectedCategory} />
            <RestaurantList toggleFavorite={toggleFavorite} favoriteRestaurants={favoriteRestaurants} addToCart={addToCart} selectedCategory={selectedCategory} />
          </>
        )}
        {currentPage === 'favorites' && (
          <FavoriteList favoriteRestaurants={favoriteRestaurants} toggleFavorite={toggleFavorite} addToCart={addToCart} />
        )}
        {currentPage === 'orders' && (
          <OrderList cartItems={cartItems} />
        )}
      </main>
      <Footer />
      {isLoginModalOpen && <LoginModal onClose={closeModal} />}
    </div>
  );
}

function Header({ onLoginClick, onNavigate }) {
  return (
    <header className="header">
      <div className="container header-content">
        <a href="#" className="logo">Eat Move</a>
        <div className="search-bar">
          <input type="text" placeholder="搜尋餐廳或美食" />
        </div>
        <div className="nav-links">
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('restaurants'); }}>餐廳列表</a>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('favorites'); }}>我的最愛</a>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('orders'); }}>我的訂單</a>
          <a href="#" className="nav-link">購物車</a>
          <button className="btn" onClick={onLoginClick}>登入</button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero">
      <h1>美味佳餚，快速送達</h1>
      <p>從您喜愛的餐廳訂購，首次訂單免費外送</p>
      <button className="btn">立即訂餐</button>
    </section>
  );
}

function Categories({ onSelectCategory, selectedCategory }) {
  const categoryList = [
    { icon: '🍔', name: '漢堡' },
    { icon: '🍕', name: '披薩' },
    { icon: '🍣', name: '壽司' },
    { icon: '🍜', name: '麵食' },
    { icon: '🥗', name: '健康餐' },
    { icon: '🍦', name: '甜點' },
    { icon: '☕', name: '咖啡' },
  ];

  return (
    <section className="categories">
      <button
        className={`category ${selectedCategory === '全部' ? 'active-category' : ''}`}
        onClick={() => onSelectCategory('全部')}
      >
        <div>📋</div>
        <div>全部</div>
      </button>

      {categoryList.map((cat, index) => (
        <button
          key={index}
          className={`category ${selectedCategory === cat.name ? 'active-category' : ''}`}
          onClick={() => onSelectCategory(cat.name)}
        >
          <div>{cat.icon}</div>
          <div>{cat.name}</div>
        </button>
      ))}
    </section>
  );
}

const restaurantsData = [
  { name: '牛魔王漢堡', category: '漢堡', rating: '4.8', reviews: '200+', time: '15-25 分鐘', price: '$$', tags: ['起司牛肉堡', '酥脆炸雞堡', '培根雙層堡', '墨西哥辣味堡', '素食大豆堡'], img: '/api/placeholder/300/180' },
  { name: '炸雞城堡', category: '漢堡', rating: '4.6', reviews: '150+', time: '20-30 分鐘', price: '$$', tags: ['經典炸雞堡', '起司火腿堡', '雙層牛肉堡', '酥炸鱈魚堡', '辣味泡菜堡'], img: '/api/placeholder/300/180' },
  { name: '義式拿坡里', category: '披薩', rating: '4.7', reviews: '180+', time: '25-35 分鐘', price: '$$', tags: ['瑪格麗特', '海鮮總匯', '炭烤牛肉', '夏威夷', '辣味莎莎'], img: '/api/placeholder/300/180' },
  { name: '薄脆之星', category: '披薩', rating: '4.5', reviews: '140+', time: '20-30 分鐘', price: '$$', tags: ['四起司披薩', '辣味義式香腸', '蘑菇雞肉', '培根番茄', '鯷魚披薩'], img: '/api/placeholder/300/180' },
  { name: '鮮味壽司郎', category: '壽司', rating: '4.9', reviews: '220+', time: '10-20 分鐘', price: '$$$', tags: ['鮭魚握壽司', '海膽軍艦', '炙燒比目魚', '鮪魚細卷', '蟹膏手卷'], img: '/api/placeholder/300/180' },
  { name: '極鮮小築', category: '壽司', rating: '4.4', reviews: '160+', time: '15-25 分鐘', price: '$$', tags: ['星鰻壽司', '甜蝦軍艦', '干貝壽司', '鰻魚卷', '炙燒干貝'], img: '/api/placeholder/300/180' },
  // 更多分類依此類推...
];

function RestaurantList({ toggleFavorite, favoriteRestaurants, addToCart, selectedCategory }) {
  const filteredRestaurants = selectedCategory === '全部'
    ? restaurantsData
    : restaurantsData.filter(res => res.category === selectedCategory);

  return (
    <>
      <h2 className="section-title">
        {selectedCategory === '全部' ? '您附近的熱門餐廳' : `為您提供「${selectedCategory}」相關店家`}
      </h2>
      <section className="restaurants">
        {filteredRestaurants.map((res, index) => (
          <div className="restaurant-card" key={index}>
            <img src={res.img} alt={res.name} className="restaurant-img" />
            <div className="restaurant-info">
              <h3 className="restaurant-name">{res.name}</h3>
              <div className="restaurant-details">
                <div className="rating">★ {res.rating} ({res.reviews})</div>
                <div className="delivery-time">{res.time}</div>
              </div>
              <div className="price">{res.price}</div>
              <div className="tags">
                {res.tags.map((tag, idx) => (
                  <span className="tag" key={idx}>{tag}</span>
                ))}
              </div>
              <button className="btn cart-button" onClick={() => addToCart(res)}>加入購物車</button>
              <button className="btn cart-button" onClick={() => toggleFavorite(res)}>
                {favoriteRestaurants.find((fav) => fav.name === res.name) ? '取消收藏' : '收藏'}
              </button>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

function FavoriteList({ favoriteRestaurants, toggleFavorite, addToCart }) {
  return (
    <>
      <h2 className="section-title">我的最愛餐廳</h2>
      <section className="restaurants">
        {favoriteRestaurants.length > 0 ? (
          favoriteRestaurants.map((res, index) => (
            <div className="restaurant-card" key={index}>
              <img src={res.img} alt={res.name} className="restaurant-img" />
              <div className="restaurant-info">
                <h3 className="restaurant-name">{res.name}</h3>
                <div className="restaurant-details">
                  <div className="rating">★ {res.rating} ({res.reviews})</div>
                  <div className="delivery-time">{res.time}</div>
                </div>
                <div className="price">{res.price}</div>
                <div className="tags">
                  {res.tags.map((tag, idx) => (
                    <span className="tag" key={idx}>{tag}</span>
                  ))}
                </div>
                <button className="btn cart-button" onClick={() => addToCart(res)}>加入購物車</button>
                <button className="btn cart-button" onClick={() => toggleFavorite(res)}>
                  取消收藏
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>目前沒有收藏的餐廳。</p>
        )}
      </section>
    </>
  );
}

function OrderList({ cartItems }) {
  return (
    <>
      <h2 className="section-title">我的訂單</h2>
      <section className="restaurants">
        {cartItems.length > 0 ? (
          cartItems.map((res, index) => (
            <div className="restaurant-card" key={index}>
              <img src={res.img} alt={res.name} className="restaurant-img" />
              <div className="restaurant-info">
                <h3 className="restaurant-name">{res.name}</h3>
                <div className="restaurant-details">
                  <div className="rating">★ {res.rating} ({res.reviews})</div>
                  <div className="delivery-time">{res.time}</div>
                </div>
                <div className="price">{res.price}</div>
              </div>
            </div>
          ))
        ) : (
          <p>目前沒有任何訂單。</p>
        )}
      </section>
    </>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-section">
          <h3>Eat Move</h3>
          <p>美味佳餚快速送到您家門口。</p>
        </div>
        <div className="footer-section">
          <h3>連結</h3>
          <ul className="footer-links">
            <li><a href="#">關於我們</a></li>
            <li><a href="#">如何使用</a></li>
            <li><a href="#">常見問題</a></li>
            <li><a href="#">聯絡我們</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>法律條款</h3>
          <ul className="footer-links">
            <li><a href="#">服務條款</a></li>
            <li><a href="#">隱私政策</a></li>
            <li><a href="#">Cookie 政策</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>下載應用程式</h3>
          <ul className="footer-links">
            <li><a href="#">iOS 應用程式</a></li>
            <li><a href="#">Android 應用程式</a></li>
          </ul>
        </div>
      </div>
      <div className="copyright">
        <p>&copy; 2025 Eat Move。保留所有權利。</p>
      </div>
    </footer>
  );
}

function LoginModal({ onClose }) {
  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">登入</h2>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>
        <form>
          <div className="form-group">
            <label htmlFor="email">電子郵件</label>
            <input type="email" id="email" className="form-control" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">密碼</label>
            <input type="password" id="password" className="form-control" required />
          </div>
          <button type="submit" className="btn full-width">登入</button>
          <p className="signup-link">
            還沒有帳號？ <a href="#">註冊</a>
          </p>
        </form>
      </div>
    </div>
  );
}
