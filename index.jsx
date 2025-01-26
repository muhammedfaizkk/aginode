import React from 'react';
import axios from 'axios';

const PaymentPage = () => {
    const handlePayment = async () => {
        try {
            // Step 1: Create an order on the backend
            const { data: order } = await axios.post('http://localhost:5000/api/create-order', {
                amount: 500, // Amount in INR
                currency: 'INR',
            });

            // Step 2: Configure Razorpay options
            const options = {
                key: 'your_key_id', // Replace with your Razorpay Key ID
                amount: order.amount, // Amount in paisa
                currency: order.currency,
                name: 'Your Company Name',
                description: 'Test Transaction',
                order_id: order.id, // Razorpay Order ID from the server
                handler: async (response) => {
                    console.log('Razorpay Response:', response);
                    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;
                    const verification = await axios.post('http://localhost:5000/api/verify-payment', {
                        razorpay_order_id,
                        razorpay_payment_id,
                        razorpay_signature,
                    });

                    if (verification.data.success) {
                        alert('Payment verified successfully');
                    } else {
                        alert('Payment verification failed');
                    }
                },
                prefill: {
                    name: 'Customer Name',
                    email: 'customer@example.com',
                    contact: '9999999999',
                },
            };

            // Step 4: Open Razorpay Checkout
            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error(error);
            alert('Something went wrong during the payment process');
        }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Pay with Razorpay</h1>
            <button onClick={handlePayment} style={{ padding: '10px 20px', fontSize: '16px' }}>
                Pay Now
            </button>
        </div>
    );
};

export default PaymentPage;