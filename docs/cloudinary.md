# Cloudinary Setup

## Environment Variables

Set these environment variables (see `.env.example`):

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Usage

A helper is provided at `app/services/cloudinary_service.ts` with:

- `uploadBuffer(buffer, options)` — upload a Buffer (uses `streamifier`)
- `uploadPath(filePath, options)` — upload a local file path
- `destroy(publicId, options)` — delete a resource by public id

## Install dependency

For buffer uploads, install `streamifier`:

```bash
npm install streamifier
```
