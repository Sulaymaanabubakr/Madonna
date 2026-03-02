const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const uid = 'dkjeDHTcodUKbVroFfWbzpgqguJ2';

async function updateAdmin() {
    try {
        const docRef = db.collection('users').doc(uid);
        const doc = await docRef.get();

        if (!doc.exists) {
            console.log('User document does not exist, creating it...');
            await docRef.set({
                email: 'madonnaexpresslinkventure@gmail.com',
                role: 'admin',
                name: 'Admin',
                createdAt: new Date().toISOString()
            });
            console.log('✅ Created user document with admin role.');
        } else {
            const data = doc.data();
            console.log('Found user profile:', data);

            const updates = { role: 'admin' };
            if (!data.email) updates.email = 'madonnaexpresslinkventure@gmail.com';
            if (!data.name) updates.name = 'Admin';
            if (!data.createdAt) updates.createdAt = new Date().toISOString();

            await docRef.update(updates);
            console.log('✅ Updated existing user profile to admin:', updates);
        }
    } catch (error) {
        console.error('Error updating admin:', error);
    } finally {
        process.exit(0);
    }
}

updateAdmin();
