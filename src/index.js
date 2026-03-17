import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

function isDuck(card) {
    return card && card.quacks && card.swims;
}

function isDog(card) {
    return card instanceof Dog;
}

function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}

class Creature extends Card {
    getDescriptions() {
        return [getCreatureDescription(this), ...super.getDescriptions()];
    }
}

class Duck extends Creature {
    constructor() {
        super('Мирная утка', 2);
    }

    quacks() {
        console.log('quack');
    }

    swims() {
        console.log('float: both;');
    }
}


class Dog extends Creature {
    constructor() {
        super('Пес-бандит', 3);
    }
}

class Trasher extends Dog {
    constructor() {
        super();
        this.name = 'Громила';
        this.maxPower = 5;
        this.currentPower = 5;
        this.updateView();
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        if (value <= 0) {
            continuation(value);
            return;
        }

        this.view.signalAbility(() => {
            continuation(Math.max(value - 1, 0));
        });
    }

    getDescriptions() {
        return ['Получает на 1 меньше урона.', ...super.getDescriptions()];
    }
}

class Gatling extends Creature {
    constructor() {
        super('Гатлинг', 6);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {oppositePlayer} = gameContext;

        taskQueue.push(onDone => this.view.showAttack(onDone));

        for (let position = 0; position < oppositePlayer.table.length; position++) {
            taskQueue.push(onDone => {
                const oppositeCard = oppositePlayer.table[position];
                if (!oppositeCard) {
                    onDone();
                    return;
                }
                this.dealDamageToCreature(2, oppositeCard, gameContext, onDone);
            });
        }

        taskQueue.continueWith(continuation);
    }
}

class Lad extends Dog {
    constructor() {
        super();
        this.name = 'Браток';
        this.maxPower = 2;
        this.currentPower = 2;
        this.updateView();
        this._lastGameContext = null;
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    static getBonus() {
        const count = this.getInGameCount();
        return (count * (count + 1)) / 2;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        this._lastGameContext = gameContext;
        this.constructor.setInGameCount(this.constructor.getInGameCount() + 1);
        gameContext.updateView();
        continuation();
    }

    doBeforeRemoving(continuation) {
        this.constructor.setInGameCount(Math.max(this.constructor.getInGameCount() - 1, 0));
        if (this._lastGameContext?.updateView) {
            this._lastGameContext.updateView();
        }
        continuation();
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        continuation(value + this.constructor.getBonus());
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        continuation(Math.max(value - this.constructor.getBonus(), 0));
    }

    getDescriptions() {
        const descriptions = super.getDescriptions();

        if (
            Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature') ||
            Lad.prototype.hasOwnProperty('modifyTakenDamage')
        ) {
            descriptions.unshift('Чем их больше, тем они сильнее');
        }

        return descriptions;
    }
}


const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
];

const banditStartDeck = [
    new Lad(),
    new Lad(),
];

// const seriffStartDeck = [
//     new Duck(),
//     new Duck(),
//     new Duck(),
// ];
//
// const banditStartDeck = [
//     new Dog(),
// ];

// const seriffStartDeck = [
//     new Duck(),
//     new Duck(),
//     new Duck(),
//     new Duck(),
// ];
//
// const banditStartDeck = [
//     new Trasher(),
// ];

// const seriffStartDeck = [
//     new Duck(),
//     new Duck(),
//     new Duck(),
//     new Gatling(),
// ];
//
// const banditStartDeck = [
//     new Trasher(),
//     new Dog(),
//     new Dog(),
// ];


const game = new Game(seriffStartDeck, banditStartDeck);

SpeedRate.set(1);

game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
