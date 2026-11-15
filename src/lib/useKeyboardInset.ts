import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Height of the on-screen keyboard above the navigation bar, or 0 when it is closed.
 * Android draws edge to edge, so the window is not resized and the screen has to make room itself.
 */
export function useKeyboardInset(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', event => setHeight(event.endCoordinates.height));
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return height;
}
