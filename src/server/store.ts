import { Player } from '../shared/player_pb';
import Maze from './maze';

const store = {
    players: <{ [e: string]: Player }> null,
    maze: <Maze> null,
    powerUpEnd: 0
}

const accessors = {
    getPlayers: () => store.players,
    getPlayer: (uuid: string) => store.players[uuid],
    getMaze: () => store.maze,
    getPowerUpEnd: () => store.powerUpEnd,
    setPlayers: (value: { [e: string]: Player }) => store.players = value,
    setPlayer: (value: Player) => store.players[value.getUuid()] = value,
    setMaze: (value: Maze) => store.maze = value,
    setPowerUpEnd: (value: integer) => store.powerUpEnd
}


export default accessors;