// src/data/orders.js
import { products } from './products.js';

export const ORDER_STATUSES = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  READY_PICKUP: 'Ready for Pickup',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const FULFILLMENT = {
  DELIVERY: 'Delivery',
  PICKUP: 'Pickup from Shop',
};

export const STORE_INFO = {
  name: 'Al-Jafar Store',
  nameAr: 'متجر الجعفر',
  address: 'Al-Rashid Street, Plumbing Market, Riyadh 12345',
  phone: '+966 50 123 4567',
  hours: 'Sat – Thu: 8:00 AM – 8:00 PM\nFriday: 2:00 PM – 8:00 PM',
  whatsapp: '+966501234567',
};

export const orders = [
  {
    id: 'ORD-2025-0001',
    date: '2025-05-01',
    customer: { name: 'Mohammed Al-Rashid', phone: '+966 50 111 2233', email: 'mo.rashid@email.com' },
    fulfillment: FULFILLMENT.DELIVERY,
    address: { street: '12 Olaya Tower Rd', city: 'Riyadh', area: 'Olaya District', notes: 'Call before delivery' },
    items: [
      { product: products[0], qty: 4, unitPrice: products[0].price },
      { product: products[2], qty: 1, unitPrice: products[2].price },
    ],
    subtotal: 4 * products[0].price + 1 * products[2].price,
    logistics: 25.0,
    tax: 0,
    total: 4 * products[0].price + 1 * products[2].price + 25.0,
    paymentMethod: 'Cash on Delivery',
    status: ORDER_STATUSES.DELIVERED,
    timeline: [
      { step: 'Placed', date: '2025-05-01', done: true },
      { step: 'Confirmed', date: '2025-05-01', done: true },
      { step: 'Shipped', date: '2025-05-02', done: true },
      { step: 'Delivered', date: '2025-05-03', done: true },
    ],
  },
  {
    id: 'ORD-2025-0002',
    date: '2025-05-03',
    customer: { name: 'Sara Al-Zahrani', phone: '+966 55 987 6543', email: '' },
    fulfillment: FULFILLMENT.PICKUP,
    address: null,
    items: [
      { product: products[6], qty: 1, unitPrice: products[6].price },
      { product: products[3], qty: 3, unitPrice: products[3].price },
    ],
    subtotal: 1 * products[6].price + 3 * products[3].price,
    logistics: 0,
    tax: 0,
    total: 1 * products[6].price + 3 * products[3].price,
    paymentMethod: 'Cash on Delivery',
    status: ORDER_STATUSES.READY_PICKUP,
    timeline: [
      { step: 'Placed', date: '2025-05-03', done: true },
      { step: 'Confirmed', date: '2025-05-03', done: true },
      { step: 'Ready for Pickup', date: '2025-05-04', done: true },
      { step: 'Delivered', date: '', done: false },
    ],
  },
  {
    id: 'ORD-2025-0003',
    date: '2025-05-04',
    customer: { name: 'Khaled Al-Otaibi', phone: '+966 56 334 5577', email: 'khaledo@work.sa' },
    fulfillment: FULFILLMENT.DELIVERY,
    address: { street: '7 King Fahd Blvd', city: 'Jeddah', area: 'Al-Hamra', notes: '' },
    items: [
      { product: products[10], qty: 1, unitPrice: products[10].price },
      { product: products[11], qty: 5, unitPrice: products[11].price },
    ],
    subtotal: 1 * products[10].price + 5 * products[11].price,
    logistics: 40.0,
    tax: 0,
    total: 1 * products[10].price + 5 * products[11].price + 40.0,
    paymentMethod: 'Cash on Delivery',
    status: ORDER_STATUSES.SHIPPED,
    timeline: [
      { step: 'Placed', date: '2025-05-04', done: true },
      { step: 'Confirmed', date: '2025-05-04', done: true },
      { step: 'Shipped', date: '2025-05-05', done: true },
      { step: 'Delivered', date: '', done: false },
    ],
  },
  {
    id: 'ORD-2025-0004',
    date: '2025-05-05',
    customer: { name: 'Abdulrahman Saeed', phone: '+966 58 442 0011', email: '' },
    fulfillment: FULFILLMENT.PICKUP,
    address: null,
    items: [
      { product: products[4], qty: 2, unitPrice: products[4].price },
      { product: products[13], qty: 10, unitPrice: products[13].price },
    ],
    subtotal: 2 * products[4].price + 10 * products[13].price,
    logistics: 0,
    tax: 0,
    total: 2 * products[4].price + 10 * products[13].price,
    paymentMethod: 'Cash on Delivery',
    status: ORDER_STATUSES.CONFIRMED,
    timeline: [
      { step: 'Placed', date: '2025-05-05', done: true },
      { step: 'Confirmed', date: '2025-05-05', done: true },
      { step: 'Ready for Pickup', date: '', done: false },
      { step: 'Delivered', date: '', done: false },
    ],
  },
  {
    id: 'ORD-2025-0005',
    date: '2025-05-06',
    customer: { name: 'Noura Al-Ghamdi', phone: '+966 50 775 9900', email: 'noura.g@email.com' },
    fulfillment: FULFILLMENT.DELIVERY,
    address: { street: '22 Prince Sultan St', city: 'Dammam', area: 'Al-Shatea', notes: 'Leave at reception' },
    items: [
      { product: products[7], qty: 1, unitPrice: products[7].price },
      { product: products[8], qty: 2, unitPrice: products[8].price },
    ],
    subtotal: 1 * products[7].price + 2 * products[8].price,
    logistics: 50.0,
    tax: 0,
    total: 1 * products[7].price + 2 * products[8].price + 50.0,
    paymentMethod: 'Cash on Delivery',
    status: ORDER_STATUSES.PENDING,
    timeline: [
      { step: 'Placed', date: '2025-05-06', done: true },
      { step: 'Confirmed', date: '', done: false },
      { step: 'Shipped', date: '', done: false },
      { step: 'Delivered', date: '', done: false },
    ],
  },
];
