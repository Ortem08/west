import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card instanceof Duck;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
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
    constructor(name, power) {
        super(name, power);
    }
    getDescriptions () {
        return [
            getCreatureDescription(this),
            ...super.getDescriptions()
        ];
    }
}

// Основа для собаки.
class Dog extends Creature {
    constructor(name='Пес-бандит', power=3) {
        super(name, power);
    }

}

class Trasher extends Dog {
    constructor(name='Громила', power=5) {
        super(name, power);

    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => {
            continuation(--value);
        });
    }

    getDescriptions() {
        return [
            ...super.getDescriptions(),
            "Получает на 1 ед. меньше урона"
        ];
    }
}

class Lad extends Dog {
    constructor(name='Братки', power=2) {
        super(name, power);
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = Math.max(value, 0);
    }

    doAfterComingIntoPlay (gameContext, continuation) {
        const newInGameCount = Lad.getInGameCount() + 1;
        Lad.setInGameCount(newInGameCount);
        super.doAfterComingIntoPlay(gameContext,continuation);
    }

    doBeforeRemoving(continuation) {
        const newInGameCount = Lad.getInGameCount() - 1;
        Lad.setInGameCount(newInGameCount);
        super.doBeforeRemoving(continuation);
    }

    static getBonus() {
        return this.getInGameCount() * (this.getInGameCount() + 1) / 2;
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        const newValue = value + Lad.getBonus();
        super.modifyDealedDamageToCreature(newValue, toCard, gameContext, continuation);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        const newValue = value - Lad.getBonus();
        super.modifyDealedDamageToCreature(newValue, fromCard, gameContext, continuation);
    }

    getDescriptions() {
        if (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature')
            || Lad.prototype.hasOwnProperty('modifyTakenDamage')) {

            return [...super.getDescriptions(),
                'Чем их больше, тем они сильнее',
            ];
        }

        return [...super.getDescriptions()];
    }
}

class Duck extends Creature {
    constructor(name='Мирная утка', power=2) {
        super(name, power);
    }

    quacks() {
        console.log('quack')
    }

    swims() {
        console.log('float: both;')
    }
}

class Gatling extends Creature {
    constructor(name='Гатлинг', power=6) {
        super(name, power);

    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();
        const oppositePlayer = gameContext.oppositePlayer;

        for(let position = 0; position < gameContext.oppositePlayer.table.length; position++) {
            taskQueue.push(onDone => this.view.showAttack(onDone));
            taskQueue.push(onDone => {
                const oppositeCard = oppositePlayer.table[position];
                this.dealDamageToCreature(2, oppositeCard, gameContext, onDone);
            });
        }

        taskQueue.continueWith(continuation);
    };
}

// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
];

// Колода Бандита, верхнего игрока.
const banditStartDeck = [
    new Lad(),
    new Lad()
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
