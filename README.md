# SlackLine


## How to
サーバの使用方法   

Node.jsインストール後   
```
$ node server.js
```

## System
システムの流れ

ルーム作成：
1. roomListというオブジェクトを作っておく
2. クライアント側からルーム名が送信される
3. roomListに同一のルーム名が   
ある場合は、入室し人数を+1   
ない場合は、ルームを作成(サーバー側で振り分け)   
4. チャットはsetされたルームへ送信
5. 退出時、ルーム人数が0になればroomListから削除

メッセージ送信（補足）：   
1. クライアント側からメッセージが送信される   
2. サーバがメッセージを解読し、スタンプ番号（00～09）と一致する場合は、スタンプを同一ルームのクライアント全員に表示   
※スタンプ画像は変更可能   


## Additional Functions
**※メッセージ翻訳機能を追加**   

メッセージを受け取るとサーバがMicrosoft Translator Text APIを使用し翻訳する   
（現状ではコンソールに出力するのみ）   

以下の部分は適宜変更してください。   
'client_id': 'XXXX',   
'client_secret': 'XXXXXXXX',   


## Development environment
macOS Sierra 10.12   
Node.js v6.9.4   
Express 4.14.0   
socket.io 1.5.1   
