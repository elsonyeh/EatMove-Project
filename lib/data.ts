export interface Restaurant {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  minimumOrder: number;
  address: string;
  phone: string;
  cuisine: string;
  isNew: boolean;
  distance?: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isPopular?: boolean;
}

// 工具函數
export const getRestaurantById = (id: string, restaurants: Restaurant[]) => {
  return restaurants.find((restaurant) => restaurant.id === id);
};

export const getMenuItems = (restaurantId: string, menuItems: MenuItem[]) => {
  return menuItems.filter((item) => item.restaurantId === restaurantId);
};

export const getPopularMenuItems = (
  restaurantId: string,
  menuItems: MenuItem[]
) => {
  return menuItems.filter(
    (item) => item.restaurantId === restaurantId && item.isPopular
  );
};
