import type { Customer, Order } from "./types";

export const dashboardMetrics = [
  {
    label: "Total Revenue",
    value: 87,
    prefix: "$",
    suffix: "K",
    sub: "+12.5% vs last month",
  },
  {
    label: "Orders Today",
    value: 29,
    sub: "8 pending fulfillment",
  },
  {
    label: "Active Products",
    value: 531,
    sub: "Across 12 collections",
  },
  {
    label: "New Customers",
    value: 14,
    sub: "4 organic from social",
  },
];

export const revenueChartData = [
  { week: "WK 1", current: 18000, previous: 14000 },
  { week: "WK 2", current: 22000, previous: 19000 },
  { week: "WK 3", current: 26000, previous: 21000 },
  { week: "WK 4", current: 21000, previous: 24000 },
];

export const recentOrders: Order[] = [
  {
    id: "#WC-89231",
    customer: "Elias Thorne",
    email: "elias@example.com",
    date: "Oct 24, 2024",
    items: 2,
    total: 1240,
    status: "processing",
  },
  {
    id: "#WC-89230",
    customer: "Sienna Miller",
    email: "sienna@example.com",
    date: "Oct 24, 2024",
    items: 1,
    total: 850,
    status: "shipped",
  },
  {
    id: "#WC-89229",
    customer: "Marcus Aris",
    email: "marcus@example.com",
    date: "Oct 23, 2024",
    items: 3,
    total: 2100,
    status: "delivered",
  },
];

export const allOrders: Order[] = [
  ...recentOrders,
  {
    id: "#WC-4092",
    customer: "Elena Rostova",
    email: "elena@example.com",
    date: "Oct 24, 2023",
    items: 2,
    total: 1240,
    status: "processing",
  },
  {
    id: "#WC-4091",
    customer: "Julian Moretti",
    email: "julian@example.com",
    date: "Oct 23, 2023",
    items: 1,
    total: 890,
    status: "shipped",
  },
  {
    id: "#WC-4090",
    customer: "Sophia Chen",
    email: "sophia@example.com",
    date: "Oct 22, 2023",
    items: 3,
    total: 2450,
    status: "delivered",
  },
  {
    id: "#WC-4089",
    customer: "Marcus Wright",
    email: "marcus.w@example.com",
    date: "Oct 21, 2023",
    items: 1,
    total: 620,
    status: "cancelled",
  },
];

export const customers: Customer[] = [
  {
    id: "1",
    name: "Julian Vossen",
    email: "julian.v@example.com",
    joinDate: "Oct 12, 2023",
    orders: 4,
    avatar: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "2",
    name: "Elena Rossi",
    email: "elena.r@example.com",
    joinDate: "Sep 28, 2023",
    orders: 7,
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "3",
    name: "Marcus Thorne",
    email: "marcus.t@example.com",
    joinDate: "Aug 15, 2023",
    orders: 2,
    avatar: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "4",
    name: "Sarah Chen",
    email: "sarah.c@example.com",
    joinDate: "Jul 03, 2023",
    orders: 11,
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
  },
];
