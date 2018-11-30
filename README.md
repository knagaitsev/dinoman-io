## Dinoman.io - Multiplayer IO Pac-Man

![alt text](https://firebasestorage.googleapis.com/v0/b/loon-ride-webpage.appspot.com/o/media%2F-LS_efyX7On2bRi0o1pU?alt=media&token=a3455e0c-0fdf-4fb6-b793-c458d3335e8b "dinoman.io")

This is the source code for the first attempt I made at a .io game. 

Video - Coding Multiplayer IO Pac-Man in One Week: https://youtu.be/9JRRUqSuKHk

To get in touch, join the Loonride Discord: https://discord.gg/Sfbg2Sh

How to run:

```bash
npm start
```

Mistakes I made:

- I deal with the food in the server very inefficiently
- I take the client-sent x and y positions, rather than updating them in the server (I implemented something to test if these values are reasonable, but it is still less secure than only taking user input)

If you are looking for a base from which to start your .io game, try this: https://github.com/Loonride/io-template