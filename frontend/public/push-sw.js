// self.addEventListener('push', function(event) {
//   if (event.data) {
//     const data = event.data.json();
//     const options = {
//       body: data.body,
//       icon: '/icons/icon-192x192.png',
//       badge: '/icons/badge-72x72.png',
//       vibrate: [100, 50, 100],
//       data: {
//         dateOfArrival: Date.now(),
//         primaryKey: 1
//       },
//       actions: [
//         {
//           action: 'open',
//           title: '열기'
//         },
//         {
//           action: 'close',
//           title: '닫기'
//         }
//       ]
//     };

//     event.waitUntil(
//       self.registration.showNotification(data.title, options)
//     );
//   }
// });

// self.addEventListener('notificationclick', function(event) {
//   event.notification.close();

//   if (event.action === 'open') {
//     event.waitUntil(
//       clients.openWindow('/')
//     );
//   }
// }); 