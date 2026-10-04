// The one cache tag for notes: admin writes call updateTag(NOTES_TAG), the
// publish-due route revalidateTag(NOTES_TAG, { expire: 0 }).
export const NOTES_TAG = "notes";
