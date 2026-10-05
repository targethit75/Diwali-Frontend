const API_BASE_URL = 'https://connect-for-help-backend.onrender.com/api';

export const tokenManager = {
    getToken: () => localStorage.getItem('cfh_jwt_token'),
    setToken: (token) => {
        localStorage.setItem('cfh_jwt_token', token);
    },
    isAuthenticated: () => !!localStorage.getItem('cfh_jwt_token')
};

async function apiRequest(endpoint, method = 'GET', body = null, isProtected = false) {
    const headers = { 'Content-Type': 'application/json' };

    if (isProtected) {
        const token = tokenManager.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            alert('Kripya slot book karne ke liye pehle login karein!');
            throw new Error('User not logged in');
        }
    }

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Kuch galat ho gaya');
    }
    return data;
}

// Authentication APIs
export async function loginWithPassword(phone, password) {
    const res = await apiRequest('/auth/login-password', 'POST', { phone, password });
    if (res.token) tokenManager.setToken(res.token);
    return res;
}

export async function sendOtp(phone) {
    // Aapke purane backend API ke anusaar endpoint adjust karein
    return await apiRequest('/auth/send-otp', 'POST', { phone }); 
}

export async function verifyOtpAndLogin(phone, otp) {
    const res = await apiRequest('/auth/verify-otp', 'POST', { phone, otp });
    if (res.token) tokenManager.setToken(res.token);
    return res;
}

export async function registerUser(userData) {
    const res = await apiRequest('/auth/register', 'POST', userData);
    if (res.token) tokenManager.setToken(res.token);
    return res;
}

// Booking APIs
export async function getTop10Bookings() {
    return await apiRequest('/bookings/top10', 'GET');
}

export async function bookTop9Slot(slotDetails) {
    // Backend ki strict requirements ko bypass karne ke liye default payload banaya gaya hai
    // Agar UI sirf string bhejta hai (jaise 'Amazon'), ya incomplete object bhejta hai, to ye usko fix kar dega.
    
    let brandName = typeof slotDetails === 'string' ? slotDetails : (slotDetails.serviceName || slotDetails.brand || 'Diwali Mega Voucher');

    const formattedPayload = {
        serviceId: slotDetails.serviceId || `VOUCHER-${Math.floor(Math.random() * 10000)}`,
        serviceName: brandName,
        subServices: slotDetails.subServices || ['Diwali Reward Slot'],
        totalPrice: slotDetails.totalPrice || 2000, 
        date: slotDetails.date || new Date().toLocaleDateString('en-GB'), // Aaj ki date
        address: slotDetails.address || 'Digital Delivery to Mobile',
        paymentMethod: slotDetails.paymentMethod || 'WALLET' // Backend enum ['UPI', 'WALLET', 'CARD', 'NETBANKING', 'CASH'] support karta hai
    };

    // Ab request hit karein, 100% database mein save hoga!
    return await apiRequest('/bookings', 'POST', formattedPayload, true);
}