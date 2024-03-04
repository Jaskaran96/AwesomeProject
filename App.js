import React, { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StyleSheet, Text, View, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView, { WebViewMessageEvent } from "react-native-webview";

import { StatusBar } from "expo-status-bar";

const SAVE_FROM_WEB = `(function() {
  var values = [],
  keys = Object.keys(localStorage),
  i = keys.length;
  values.push({key:"test",value:"okkk"})
  while ( i-- ) {
      values.push({key: keys[i], value: localStorage.getItem(keys[i])});
  }
  window.ReactNativeWebView.postMessage(JSON.stringify({type: 'webview/save', payload: values}));
})();`;

async function handleOnMessage(event) {
  const message = JSON.parse(event.nativeEvent.data);
  switch (message.type) {
    case "webview/save": {
      const data = message.payload;
      data.forEach((dt) => {
        AsyncStorage.setItem(dt.key, dt.value);
      });
      console.log(await AsyncStorage.getAllKeys());
      break;
    }
    default:
      throw new Error("invalid case");
  }
}

export default function App() {
  const [initScript, setInitScript] = useState();
  const webRef = useRef(null);
  async function handleInit() {
    const allKeys = await AsyncStorage.getAllKeys();
    console.log(allKeys);
    if (allKeys.length === 0) {
      setInitScript(SAVE_FROM_WEB);
    }

    const SAVE_FROM_RN = `(function() {
      ${allKeys.map(
        (key) => `localStorage.setItem(${key}, ${AsyncStorage.getItem(key)});`
      )}
    })();`;

    setInitScript(SAVE_FROM_RN);
  }

  const refreshHandler = () => {
    setInterval(() => {
      webRef.current?.injectJavaScript(SAVE_FROM_WEB);
    }, 10000);
  };

  useEffect(() => {
    handleInit().then(refreshHandler);
  }, []);
  //console.log(initScript);
  return (
    <SafeAreaView style={styles.container}>
      {
        <WebView
          ref={webRef}
          injectedJavaScriptBeforeContentLoaded={initScript}
          source={{
            uri: "http://192.168.95.210:3001/water?geoserver_url=https://geoserver.gramvaani.org:8443&block_pkey=null&app_name=nrmApp&dist_name=Angul&block_name=Angul",
          }}
          onMessage={handleOnMessage}
          scalesPageToFit={false}
        />
      }
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ container: { flex: 1 } });
