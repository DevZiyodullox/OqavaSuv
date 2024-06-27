const User = require('./src/model'); // User modelining joylashgan joy
const mongoose = require('mongoose');
require('dotenv').config();

const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Could not connect to MongoDB:', error.message);
        process.exit(1); // Exit with failure
    }
};

const createAdminUser = async () => {
    await connectToDatabase();

    const chatId = '1369846504'; // O'zingizning Telegram chat ID ni qo'ying
    let adminUser = await User.findOne({ chatId });

    if (!adminUser) {
        adminUser = new User({
            chatId,
            name: 'Admin',
            isAdmin: true,
        });
        await adminUser.save();
        console.log('Admin user created');
    } else if (!adminUser.isAdmin) {
        adminUser.isAdmin = true;
        await adminUser.save();
        console.log('Admin user updated');
    }

    mongoose.disconnect();
};

createAdminUser();
