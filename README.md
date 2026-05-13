# Zentra Weekly Report Dashboard

This folder is a static GitHub Pages dashboard for showing a sample weekly Zentra email and collecting signup requests.

## Publish on GitHub Pages

1. Commit the `docs/` folder to the repository.
2. In GitHub, open `Settings` > `Pages`.
3. Set the source to the repository branch and `/docs` folder.
4. Save. GitHub will provide the public dashboard URL.

## Connect the Signup Form

Static GitHub Pages cannot store email addresses by itself. By default, the form opens a prepared email to `dialameh.babak@gmail.com`.

To submit signups to a real endpoint instead, edit `docs/app.js`:

```js
const SIGNUP_ENDPOINT = "https://your-form-or-api-endpoint.example";
```

The page will send:

```json
{
  "email": "name@example.com",
  "source": "zentra-dashboard"
}
```

Good endpoint options include Formspree, Google Apps Script, Airtable Forms, or a small GitHub Actions-backed API.
