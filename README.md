khusus project ini harus run admin karena pakai script

jika belom di expose 
expose dengan cara :
1. buat .env.development 
2. masukan ip device dan port backend 


Frontend 
npm run dev -- --host 0.0.0.0 --port 5173

BACKEND 
1.cd backend

2.
jika powershell :
.\.venv\Scripts\activate

jika git 
source ./venv/Scripts/activate

3.ketika sudah masuk venv
uvicorn main:app --host 0.0.0.0 --port 8000

ketika sudah :
device 1 access /display1
device 2 access /display2
device 3 access /display3

**Mode Kiosk Chrome**
ctrl + run kemudian masukan ini :
"C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173/ --kiosk --start-fullscreen --disable-infobars

