import { User, SalonTillInfo, Order } from '../types';

export const INITIAL_STAFF: User[] = [];

export const MANAGER_USER: User = {
  id: 'mgr-1',
  name: 'Jean Claude Kalonda',
  phone: '+255 754 000 111',
  email: 'jeanclaudekalonda1@gmail.com',
  role: 'manager',
  username: 'jeanclaudekalonda1@gmail.com',
  password: 'juanclaudio',
  salary: 1500000,
  avatar: undefined
};

export const SAMPLE_CLIENT_USER: User = {
  id: 'cust-101',
  name: 'Client User',
  phone: '+255 712 345 678',
  email: 'client@saloonms.co.tz',
  role: 'customer',
  username: 'client',
  password: '123',
  avatar: undefined
};

export const SALON_TILL_DETAILS: SalonTillInfo[] = [
  {
    provider: 'mpesa',
    name: 'M-Pesa (Vodacom)',
    tillNumber: '5521990',
    accountName: 'DREADLOCKS AND HAIR DRESSING SALOON',
    ussdCode: '*150*00#',
    instructionsSw: 'Piga *150*00# -> Chagua 4 (Lipa kwa M-Pesa) -> Chagua 1 (Lipa Namba ya Wafanyabiashara) -> Weka Namba 5521990 -> Weka Kiasi.',
    instructionsEn: 'Dial *150*00# -> Select 4 (Lipa M-Pesa) -> Select 1 (Pay to Merchant Till) -> Enter 5521990 -> Enter Amount -> PIN.',
    instructionsFr: 'Composez *150*00# -> Option 4 (Paiement) -> Option 1 (Numéro Commerçant) -> Entrez 5521990 -> Montant -> PIN.',
    color: '#e11d48',
    bgColor: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    iconName: 'Vodacom M-Pesa'
  },
  {
    provider: 'yas',
    name: 'Mix by Yas / Tigo Pesa',
    tillNumber: '7845120',
    accountName: 'DREADLOCKS AND HAIR DRESSING SALOON',
    ussdCode: '*150*01#',
    instructionsSw: 'Piga *150*01# au tumia App ya Mix by Yas -> Chagua Lipa kwa Simu -> Weka Lipa Namba 7845120 -> Weka Kiasi.',
    instructionsEn: 'Dial *150*01# or open Mix by Yas App -> Pay Merchant -> Enter Till 7845120 -> Enter Amount -> PIN.',
    instructionsFr: 'Composez *150*01# ou App Yas -> Payer Marchand -> Entrez 7845120 -> Montant -> PIN.',
    color: '#0284c7',
    bgColor: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    iconName: 'Mix by Yas / Tigo'
  },
  {
    provider: 'airtel',
    name: 'Airtel Money',
    tillNumber: '3366990',
    accountName: 'DREADLOCKS AND HAIR DRESSING SALOON',
    ussdCode: '*150*60#',
    instructionsSw: 'Piga *150*60# -> Chagua Lipa Bili / Huduma -> Weka Namba ya Kampuni 3366990 -> Weka Kiasi.',
    instructionsEn: 'Dial *150*60# -> Lipa Merchant -> Enter Merchant ID 3366990 -> Enter Amount -> PIN.',
    instructionsFr: 'Composez *150*60# -> Paiement Marchand -> Entrez ID 3366990 -> Montant -> PIN.',
    color: '#ef4444',
    bgColor: 'bg-red-500/10 border-red-500/30 text-red-400',
    iconName: 'Airtel Money'
  },
  {
    provider: 'halopesa',
    name: 'Halopesa',
    tillNumber: '1122880',
    accountName: 'DREADLOCKS AND HAIR DRESSING SALOON',
    ussdCode: '*150*88#',
    instructionsSw: 'Piga *150*88# -> Chagua 4 (Lipa kwa Halopesa) -> Weka Namba 1122880 -> Weka Kiasi.',
    instructionsEn: 'Dial *150*88# -> Pay by Halopesa -> Enter Merchant Code 1122880 -> Enter Amount -> PIN.',
    instructionsFr: 'Composez *150*88# -> Payer par Halopesa -> Code 1122880 -> Montant -> PIN.',
    color: '#eab308',
    bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    iconName: 'Halopesa'
  }
];

export const INITIAL_SAMPLE_ORDERS: Order[] = [];
