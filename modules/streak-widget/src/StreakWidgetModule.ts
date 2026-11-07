import { NativeModule, requireOptionalNativeModule } from 'expo';

declare class StreakWidgetModule extends NativeModule<Record<never, never>> {
  updateAsync(json: string): Promise<boolean>;
  countAsync(): Promise<number>;
  requestPinAsync(): Promise<boolean>;
}

// Optional so the JS keeps working in environments without the native code (e.g. web/Expo Go).
export default requireOptionalNativeModule<StreakWidgetModule>('StreakWidget');
