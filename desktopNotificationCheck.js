import { flashTitle } from "./flashTitle";

 (() => {
  // 1) اگر مرورگر نوتیفیکیشن را پشتیبانی نمی‌کند
  if (!("Notification" in window)) {

    flashTitle("⚠️ این مرورگر نوتیفیکیشن را پشتیبانی نمی‌کند!");
    
    return;
  }

  // 2) اگر قبلاً اجازه داده شده
  if (Notification.permission === "granted") {
    console.log("نوتیفیکیشن قبلاً مجاز شده");
    return;
  }

  // 3) اگر نه مجاز است نه بلاک شده → از کاربر اجازه می‌گیریم
  if (Notification.permission === "default") {
    Notification.requestPermission().then(result => {
      if (result === "granted") {
        console.log("کاربر اجازه داد");
      } else {
        console.log("کاربر اجازه نداد");
      }
    });
  }


  if (Notification.permission === "denied") {
    flashTitle("⚠️ دسکتاپ نوتیفیکیشن غیر فعال است!");
    return;
  }



  
  // 4) اگر permission = denied بود، نمی‌توانی دوباره درخواست بدهی
  // فقط باید کاربر خودش از تنظیمات مرورگر اصلاح کند
})()