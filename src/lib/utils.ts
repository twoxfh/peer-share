export function saveBlob(filename: string, blob: Blob) {
  const link = document.createElement('a');
  link.hidden = true;
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url));
}
