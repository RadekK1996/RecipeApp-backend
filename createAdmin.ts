import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import {config} from 'dotenv';

config();

import {UserModel} from './models/Users';

const createAdmin = async (): Promise<void> => {
    try {
        await mongoose.connect(process.env.MONGO_URL as string);
        console.log('Successfully connected to database');

        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD as string, 10);


        const adminUser = new UserModel({
            username: process.env.ADMIN_USERNAME,
            password: hashedPassword,
            isAdmin: true,
        });

        await adminUser.save();

        console.log('Admin user created successfully');
    } catch (error) {
        console.error('Could not connect to database:', error);
    } finally {
        await mongoose.connection.close();
    }
};

createAdmin();
