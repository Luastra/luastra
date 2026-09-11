export function createHandlers() {
  return Object.freeze({
    async "content.upload.create.v1"(input, context) {
      return context.content.createUploadIntent(input.purpose, { mediaType: input.mediaType, bytes: input.bytes, width: input.width, height: input.height });
    },
    async "content.upload.commit.v1"(input, context) { return context.content.commitUpload(input.handle); },
    async "content.upload.delete.v1"(input, context) {
      return { deleted: await context.content.deleteUploaded(input.purpose, input.objectId, { mediaType: input.mediaType, bytes: input.bytes, width: input.width, height: input.height }) };
    }
  });
}
