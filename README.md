Taryn Doppovich is the friend we all had in highschool.

He'll go back in your Facebook Menssagner and Telegram chat history and find
the most hilarious things you and your friends have said to each other.

### A Note on fixing facebook message dumps

For whatever reason facebook has some weird encoding in their JSON dumps of the messages. Can be fixed using:

```
cat message_1.json | jq . | iconv -f utf8 -t latin1 > m1.json
```
