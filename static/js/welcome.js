function submitCode() {
    const code = document.getElementById('activationCode').value;
    const messageDiv = document.getElementById('message');

    fetch('/api/activate', {  // استبدل بمسار API الفعلي
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            messageDiv.textContent = 'تم التفعيل بنجاح! جارٍ إعادة التوجيه...';
            //  window.location.href = 'dashboarduser.html';
        } else {
            messageDiv.textContent = data.message || 'حدث خطأ أثناء التفعيل.';
            messageDiv.style.color = 'red';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        messageDiv.textContent = 'حدث خطأ أثناء الاتصال بالخادم.';
        messageDiv.style.color = 'red';
    });
}
