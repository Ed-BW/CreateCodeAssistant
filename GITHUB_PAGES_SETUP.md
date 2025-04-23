# Setting Up GitHub Pages Deployment

Follow these steps to deploy your Create Code Assistant to GitHub Pages:

## 1. Create a GitHub repository

If you haven't already, create a new GitHub repository:

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top-right corner and select "New repository"
3. Name your repository `create-code-assistant`
4. Make it public (or private, but GitHub Pages will still be publicly accessible)
5. Click "Create repository"

## 2. Push your code to GitHub

From your local project directory:

```bash
# Initialize Git repository (if not already done)
git init

# Add all files to staging
git add .

# Commit the files
git commit -m "Initial commit"

# Add the remote repository
git remote add origin https://github.com/YOUR-USERNAME/create-code-assistant.git

# Push to GitHub
git push -u origin main
```

## 3. Configure GitHub Pages

The GitHub Actions workflow in `.github/workflows/deploy.yml` will automatically build and deploy your site to GitHub Pages whenever you push to the main branch.

You need to enable GitHub Pages in your repository settings:

1. Go to your repository on GitHub
2. Click "Settings"
3. In the left sidebar, click "Pages"
4. Under "Source", select "GitHub Actions"

## 4. Check your deployment

The first time you push to the repository, the GitHub Actions workflow will run and deploy your site.

Once the workflow completes successfully, your site will be available at:
`https://YOUR-USERNAME.github.io/create-code-assistant/`

## 5. Making updates

Whenever you make changes and push them to the `main` branch, GitHub Actions will automatically rebuild and redeploy your site.

For example:

```bash
# Make changes to your code
# ...

# Add and commit changes
git add .
git commit -m "Update site with new features"

# Push to GitHub
git push origin main
```

The GitHub Actions workflow will run, and your site will be updated shortly after.

## Troubleshooting

- If the deployment fails, check the "Actions" tab in your GitHub repository to see the error logs
- Make sure the `base` in your `vite.config.js` matches your repository name
- Ensure that the GitHub Pages source is set to GitHub Actions 