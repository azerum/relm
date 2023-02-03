import { useElm } from './useElm';

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

const None: Command = { type: 'none' };

type Model = {
    type: 'loaded';
    people: Person[];
    fetchId: number;
    time: number | null;
} | {
    type: 'loading';
    lastPeople: Person[];
    fetchId: number;
    time: number | null;
} | {
    type: 'loadingLong';
    fetchId: number;
    time: number | null;
};

function init(): [Model, Command] {
    return [
        {
            type: 'loading',
    
            lastPeople: [],
            fetchId: 0,

            time: null
        },

        {
            type: 'fetch',
            id: 0
        }
    ];
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
} | {
    type: 'tick';
    time: number;
}

function update(model: Model, message: Message): [Model, Command] {
    switch (message.type) {
        case 'gotResponse':
            if (model.fetchId !== message.fetchId) {
                return [model, None];
            }

            return [
                {
                    type: 'loaded',
    
                    people: message.people,
                    fetchId: model.fetchId + 1,

                    time: model.time
                },

                None
            ];

        case 'waitedLong': 
            if (model.fetchId !== message.fetchId) {
                return [model, None]
            }

            return [
                {
                    type: 'loadingLong',
                    fetchId: model.fetchId,

                    time: model.time
                },

                None
            ];
            

        case 'refetchRequested': {
            const lastPeople = model.type === 'loaded'
                ? model.people
                : model.type === 'loading'
                    ? model.lastPeople
                    : [];

            return [
                {
                    type: 'loading',
    
                    lastPeople,
                    fetchId: model.fetchId,

                    time: model.time
                },

                {
                    type: 'fetch',
                    id: model.fetchId,
                }
            ];
        }

        case 'tick': 
            return [
                {
                    ...model,
                    time: message.time
                },

                None
            ];
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
            <p>
            {model.time === null
                ? 'Loading time...'
                : new Date(model.time).toISOString()
            }
            </p>

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

function subscribe(message: (m: Message) => void): () => void {
    const interval = setInterval(() => {
        message({
            type: 'tick',
            time: Date.now()
        })
    }, 1000);

    return () => {
        clearInterval(interval);
    };
}

export default function Example() {
    const [model, message] = useElm(
        init(),
        update,
        execute,
        subscribe
    );

    return view(model, message);
}
