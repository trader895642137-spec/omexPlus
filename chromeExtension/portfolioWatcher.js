// const port = chrome.runtime.connect({ name: "CHILD_PAGE" });

// port.onMessage.addListener((data) => {
//   console.log("📥 Data from parent:", data);

//   // استفاده کن
//   document.body.innerHTML = `
//     <pre>${JSON.stringify(data, null, 2)}</pre>
//   `;
// });


console.log('child')
try {
    const port = chrome.runtime.connect({ name: "CHILD_PAGE" });
    port.onMessage.addListener(data =>{
        console.log(data)
    } );
} catch(err) {
    console.error("Cannot connect to background:", err);
}