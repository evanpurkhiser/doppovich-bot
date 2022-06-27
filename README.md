Taryn Doppovich is the friend we all had in high school.

He'll go back in your Facebook Messenger and Telegram chat history and find
the most hilarious things you and your friends have said to each other.

### The history of Taryn Doppovich

> Two of my good friends grew up together in Mountain View. Any time I would
> hangout with them together, they would inevitably reminisce about someone
> they both knew in high school. I would end up feeling excluded from these
> conversations and would always point out how ridiculous their high school
> friends names were.
>
> One time when they did this, I burst out "Oh yea Kary Pontier, didn't she
> date Taryn Doppovich", Taryn of course, being a completely made up name.
> Hilariously, my friends immeidately went with it. Since then we've
> continually imagined up more and more backstory for Taryn ("Dude.. you know
> Taryn hates when you bring up that accident in 8th grade")

> I recently had a fun idea for a Telegram bot which could be in our friends
> group chat, that would every once in a pick a random message from the chat
> history, and post it in the chat.
>
> One of my friends immediately said "Can the bot be Taryn"?

And thus, doppovich bot was born.

### Getting chat History

**Telegram** chat history can be exported in JSON format using the [Telegram
Desktop App](https://desktop.telegram.org/).

**Facebook** messenger history can be exported by [downloading your facebook
data](https://www.facebook.com/help/212802592074644).

#### A Note on fixing Facebook message dumps

For whatever reason Facebook has some weird encoding in their JSON dumps of the
messages. Can be fixed using:

```
cat message_1.json | jq . | iconv -f utf8 -t latin1 > m1.json
```
