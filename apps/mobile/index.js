/**
 * @format
 */

import { AppRegistry, Platform } from 'react-native';
import App from './App';
import appConfig from './app.json';

// Support both legacy and new 'expo' object structure
const appName = appConfig.name || appConfig.expo?.name || 'BlitzrMobile';

AppRegistry.registerComponent(appName, () => App);

if (Platform.OS === 'web') {
    const rootTag = document.getElementById('root') ?? document.getElementById('main');
    AppRegistry.runApplication(appName, { rootTag });
}
