# Google Sheets & Email Contact Form Setup

Since I cannot directly access your Google Account, you need to set up the backend script yourself. Follow these steps carefully:

## Step 1: Create a Google Sheet
1. Go to [Google Sheets](https://docs.google.com/spreadsheets/).
2. Create a **Blank spreadsheet**.
3. Name it "Portfolio Contact Form" (or anything you like).
4. In the first row, add these headers:
   - **A1**: Date
   - **B1**: Name
   - **C1**: Email
   - **D1**: Subject
   - **E1**: Message

## Step 2: Create the Google Apps Script
1. In your Google Sheet, click on **Extensions** > **Apps Script**.
2. Delete any code in the `Code.gs` file and paste the following code:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = e.parameter;
    
    // 1. Append data to Google Sheet
    sheet.appendRow([new Date(), data.name, data.email, data.subject, data.message]);
    
    // 2. Send Email Notification
    var emailRecipient = "hetshah2004@gmail.com"; // <--- REPLACE WITH YOUR EMAIL
    var subject = "New Portfolio Contact: " + data.subject;
    var body = "You received a new message from your portfolio:\n\n" +
               "Name: " + data.name + "\n" +
               "Email: " + data.email + "\n" +
               "Subject: " + data.subject + "\n" +
               "Message: " + data.message;
               
    MailApp.sendEmail(emailRecipient, subject, body);
    
    // 3. Return Success Response
    return ContentService.createTextOutput(JSON.stringify({"result":"success"}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"result":"error", "error": error.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. **Important**: Change `hetshah2004@gmail.com` to your actual email address if it's different.
4. Press `Ctrl + S` (or Cmd + S) to save the project. Name it "Contact Form Script".

## Step 3: Deploy as Web App
1. Click the blue **Deploy** button (top right) > **New deployment**.
2. Click the gear icon (Select type) > **Web app**.
3. Fill in the details:
   - **Description**: Contact Form Backend
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone** (This is crucial for the form to work without login)
4. Click **Deploy**.
5. You will be asked to **Authorize access**. Click "Review permissions", choose your account, click "Advanced" > "Go to Contact Form Script (unsafe)" > "Allow".
6. Copy the **Web App URL** (it starts with `https://script.google.com/macros/s/...`).

## Step 4: Update Your Portfolio Code
1. Open `d:\project\portfolio\Portfolio\app.js`.
2. Find line 121:
   ```javascript
   const scriptURL = 'YOUR_GOOGLE_SCRIPT_WEB_APP_URL_HERE';
   ```
3. Replace `'YOUR_GOOGLE_SCRIPT_WEB_APP_URL_HERE'` with the URL you just copied.

**Example:**
```javascript
const scriptURL = 'https://script.google.com/macros/s/AKfycbx.../exec';
```

4. Save the file.

## Step 5: Test It
1. Go to your portfolio website.
2. Fill out the contact form.
3. Click "Send Message".
4. You should see a "Message sent successfully!" alert.
5. Check your Google Sheet to see the new row.
6. Check your Gmail to see the notification email.
