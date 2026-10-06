import { route, readJson, paramsOf, HttpError } from '@/lib/http';
import { write } from '@/lib/db';
import { requireAdmin, publicUser } from '@/lib/auth';
import { validateUserPatch } from '@/lib/validate';

// Guard rail: the shop must always keep at least one active admin.
function assertAdminRemains(db, changingId, next) {
  const admins = db.users.filter((u) => {
    const v = u.id === changingId ? next : u;
    return v && v.role === 'admin' && v.active;
  });
  if (admins.length === 0) throw new HttpError(400, 'You can’t remove the last active admin.');
}

// PATCH /api/users/:id — change role, pause/unpause, edit name/phone (admin)
export const PATCH = route(async (req, ctx) => {
  const me = await requireAdmin();
  const { id } = await paramsOf(ctx);
  const changes = validateUserPatch(await readJson(req));
  const user = await write((db) => {
    const u = db.users.find((x) => x.id === id);
    if (!u) throw new HttpError(404, 'User not found.');
    if (u.id === me.id && changes.active === false) throw new HttpError(400, 'You can’t pause your own account.');
    assertAdminRemains(db, u.id, { ...u, ...changes });
    Object.assign(u, changes);
    return u;
  });
  return { user: publicUser(user) };
});

// DELETE /api/users/:id (admin). Their past orders are kept for your records.
export const DELETE = route(async (req, ctx) => {
  const me = await requireAdmin();
  const { id } = await paramsOf(ctx);
  if (id === me.id) throw new HttpError(400, 'You can’t delete your own account.');
  await write((db) => {
    const i = db.users.findIndex((x) => x.id === id);
    if (i === -1) throw new HttpError(404, 'User not found.');
    assertAdminRemains(db, id, null);
    db.users.splice(i, 1);
  });
  return { ok: true };
});
