const admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});
admin.auth().listUsers(10).then((result) => {
  console.log("Users:", result.users.map(u => ({ email: u.email, uid: u.uid })));
}).catch(console.error);
