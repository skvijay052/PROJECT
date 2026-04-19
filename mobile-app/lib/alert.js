import { Alert as NativeAlert } from 'react-native';

let showAlertHandler = null;

function normalizeButtons(buttons) {
  if (Array.isArray(buttons) && buttons.length > 0) {
    return buttons.map((button) => ({
      text: button?.text || 'OK',
      onPress: typeof button?.onPress === 'function' ? button.onPress : undefined,
      style: button?.style,
    }));
  }

  return [{ text: 'Got it' }];
}

export function registerAlertHost(handler) {
  showAlertHandler = handler;

  return () => {
    if (showAlertHandler === handler) {
      showAlertHandler = null;
    }
  };
}

const Alert = {
  alert(title, message = '', buttons, options) {
    const request = {
      title: title || '',
      message: message || '',
      buttons: normalizeButtons(buttons),
      options: options || {},
    };

    if (typeof showAlertHandler === 'function') {
      showAlertHandler(request);
      return;
    }

    NativeAlert.alert(request.title, request.message, request.buttons, request.options);
  },
};

export default Alert;
