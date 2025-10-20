export interface User {
  id: string;
  email: string;
  role: 'admin' | 'owner' | 'player';
  name: string;
  profilePicture?: string;
  suspended?: boolean;
  joinDate?: Date; // 👈 yeh add karo
}


export interface Owner {
  id: string;
  user: User;
  registrationDate: Date;
  approvalStatus: 'pending' | 'approved' | 'rejected';
}

export interface Player {
  id: string;
  user: User;
  joinedDate: Date;
}

export interface Complaint {
  id: string;
  createdAt: Date;
  description: string;
  groundId: string;
  groundName: string;
  ownerId: string;
  ownerName: string;
  playerEmail: string;
  playerId: string;
  playerName: string;
  status: 'pending' | 'resolved' | 'escalated';
  type: string;
  complaintType: 'player' | 'owner';
  resolvedAt?: Date;
}

export interface Booking {
  id: string;
  user: User;
  ground: string;
  date: Date;
  amount: number;
  status: 'confirmed' | 'cancelled' | 'pending';
  duration?: number;
  paymentId?: string;
}

export interface Payment {
  transactionDate: string | number | Date;
  id: string;
  bookingId: string;
  amount: number;
  method: string;
  status: 'success' | 'failed' | 'pending' | 'refunded';
}

export interface Court {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  owner: User;
  facilities: string[];
  pricePerHour: number;
  status: 'active' | 'inactive';
}

export interface Review {
  id: string;
  comment: string;
  createdAt: Date;
  groundId: string;
  rating: number;
  userId: string;
  userName: string;
}

export interface Report {
  id: string;
  type: 'earnings' | 'active_users' | 'most_booked' | 'revenue';
  title: string;
  data: any;
  generatedAt: Date;
}
