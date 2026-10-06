import { route, HttpError } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { saveUpload } from '@/lib/uploads';

// POST /api/upload  (multipart form, field name "file") → { url }
export const POST = route(async (req) => {
  await requireAdmin();
  let form;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, 'Send the photo as multipart form data.');
  }
  const url = await saveUpload(form.get('file'));
  return Response.json({ url }, { status: 201 });
});
