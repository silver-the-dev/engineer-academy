import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function exportReviewFile(name: string, contents: string, save: boolean): Promise<void> {
  if (save || !await Sharing.isAvailableAsync()) {
    const folder = await Directory.pickDirectoryAsync();
    const file = folder.createFile(name, 'application/json');
    await file.write(contents);
    return;
  }
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  await file.write(contents);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Relatório de revisão' });
}
