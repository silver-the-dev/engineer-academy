import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

async function writeAtomically(file: File, contents: string): Promise<void> {
  try {
    await file.write(contents);
  } catch (error) {
    try { file.delete(); } catch {}
    throw error;
  }
}

export async function exportReviewFile(name: string, contents: string, save: boolean): Promise<void> {
  if (save || !await Sharing.isAvailableAsync()) {
    const folder = await Directory.pickDirectoryAsync();
    const file = folder.createFile(name, 'application/json');
    await writeAtomically(file, contents);
    return;
  }
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  await writeAtomically(file, contents);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Relatório de revisão' });
}
