export class FirestoreDocumentValidationError extends Error {
  constructor(props: { documentName: string; path: string }) {
    const message = `Validation failed for ${props.documentName} at path: ${props.path}`;
    super(message);
  }
}
