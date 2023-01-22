import { useEffect, useReducer } from 'react';

interface Person {
    id: number;
    name: string;
    age: number;
}

type Command = {
    type: 'none';
} | {
    type: 'fetch';
    id: number;
};

type Model = {
    command: Command;
} & ({
    type: 'loaded';
    people: Person[];
    fetchId: number;
} | {
    type: 'loading';
    lastPeople: Person[];
    fetchId: number;
}  | {
    type: 'loadingLong';
    fetchId: number;
});

function init(): Model {
    return {
        command: {
            type: 'fetch',
            id: 0
        },

        type: 'loading',

        lastPeople: [],
        fetchId: 0
    };
}

type Message = {
    type: 'gotResponse';
    people: Person[];
    fetchId: number;
} | {
    type: 'waitedLong'; 
    fetchId: number;
} | {
    type: 'refetchRequested';
};

function update(model: Model, message: Message): Model {
    switch (message.type) {
        case 'gotResponse':
            if (model.fetchId !== message.fetchId) {
                return model;
            }

            return {
                command: { type: 'none' },

                type: 'loaded',

                people: message.people,
                fetchId: model.fetchId + 1
            };

        case 'waitedLong': 
            if (model.fetchId !== message.fetchId) {
                return model;
            }

            return {
                command: { type: 'none' },

                type: 'loadingLong',
                fetchId: model.fetchId
            };

        case 'refetchRequested': {
            const lastPeople = model.type === 'loaded'
                ? model.people
                : model.type === 'loading'
                    ? model.lastPeople
                    : [];

            return {
                command: {
                    type: 'fetch',
                    id: model.fetchId,
                },

                type: 'loading',

                lastPeople,
                fetchId: model.fetchId
            };
        }
    }
}

async function execute(command: Command, message: (m: Message) => void) {
    switch (command.type) {
        case 'none':
            break;

        case 'fetch': {
            setTimeout(() => {
                message({
                    type: 'waitedLong',
                    fetchId: command.id
                });
            }, 200);

            const response = await fetch('http://localhost:8000/people');
            const people = await response.json();

            message({
                type: 'gotResponse',
                people,
                fetchId: command.id
            });
        } break;
    }
}

function view(model: Model, message: (m: Message) => void): JSX.Element {
    return (
        <>
            <button
                onClick={() => message({ type: 'refetchRequested' })}
            >
                Refresh
            </button>

            {(() => {
                if (model.type === 'loadingLong') {
                    return <p>Loading...</p>;
                }

                const people = model.type === 'loaded'
                    ? model.people
                    : model.lastPeople;

                return (
                    <ul>
                        {people.map(p => (
                            <li key={p.id}>
                                {p.name}, {p.age}
                            </li>
                        ))}
                    </ul>
                );
            })()}
        </>
    );
}

function App() {
    const [model, message] = useReducer(update, init());

    useEffect(() => {
        execute(model.command, message);
    }, [model.command]);

    return view(model, message);
}

export default App;
