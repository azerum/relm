import { useElm } from './useElm';

export interface Model {
    firstName: string;
    lastName: string;

    state: State;
    nextRequestId: number;
}

export const debounceTimeMs = 1000;

export type State = {
    type: 'editedUnknownTime';
} | {
    type: 'edited';
    editTimeMs: number;
} | {
    type: 'saving';
    requestId: number;
} | {
    type: 'clean';
} | {
    type: 'failedToSave';
};

export type Command = {
    type: 'none';
} | {
    type: 'request';
    id: number;
    firstName: string;
    lastName: string;
};

export const None: Command = { type: 'none' };

export function init(): [Model, Command] {
    return [
        {
            firstName: 'Bob',
            lastName: 'Bobski',

            state: {
                type: 'clean'
            },

            nextRequestId: 0
        },

        None
    ];
}

export type Message = {
    type: 'firstNameEdited' | 'lastNameEdited';
    value: string;
} | {
    type: 'tick';
    timeMs: number;
} | {
    type: 'gotResponse';
    requestId: number;
} | {
    type: 'requestFailed';
    requestId: number;
};

export function update(model: Model, message: Message): [Model, Command] {
    switch (message.type) {
        case 'firstNameEdited':
        case 'lastNameEdited': {
            const edited = (message.type === 'firstNameEdited')
                ? { firstName: message.value }
                : { lastName: message.value };

            return [
                {
                    ...model,
                    ...edited,

                    state: {
                        type: 'editedUnknownTime'
                    }
                },

                None
            ];
        }

        case 'tick': {
            switch (model.state.type) {
                case 'editedUnknownTime':
                    return [
                        {
                            ...model,
                            state: {
                                type: 'edited',
                                editTimeMs: message.timeMs
                            }
                        },

                        None
                    ];

                case 'edited': {
                    const elapsed = message.timeMs - model.state.editTimeMs;

                    if (elapsed >= debounceTimeMs) {
                        return [
                            {
                                ...model,

                                state: {
                                    type: 'saving',
                                    requestId: model.nextRequestId
                                },

                                nextRequestId: model.nextRequestId + 1
                            },

                            {
                                type: 'request',
                                id: model.nextRequestId,

                                firstName: model.firstName,
                                lastName: model.lastName
                            }
                        ];
                    }
                }
            }

            return [model, None];
        }

        case 'gotResponse':
            if (
                model.state.type !== 'saving' ||
                model.state.requestId !== message.requestId
            ) {
                return [model, None];
            }

            return [
                {
                    ...model,

                    state: {
                        type: 'clean'
                    }
                },

                None
            ];

        case 'requestFailed':
            if (
                model.state.type !== 'saving' ||
                model.state.requestId !== message.requestId
            ) {
                return [model, None];
            }

            return [
                {
                    ...model,

                    state: {
                        type: 'failedToSave'
                    }
                },

                None
            ];
    }
}

export async function execute(command: Command, message: (m: Message) => void) {
    switch (command.type) {
        case 'none':
            break;

        case 'request':
            try {
                const response = await fetch(
                    'http://localhost:8000/edit',
                    {
                        method: 'POST',

                        body: JSON.stringify({
                            firstName: command.firstName,
                            lastName: command.lastName
                        }),

                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.ok) {
                    message({
                        type: 'gotResponse',
                        requestId: command.id
                    });
                }
            }
            catch {}

            message({
                type: 'requestFailed',
                requestId: command.id
            });

            break;
    }
}

export function subscribe(message: (m: Message) => void): () => void {
    const interval = setInterval(() => {
        message({
            type: 'tick',
            timeMs: Date.now()
        });
    }, 1000);

    return () => {
        clearInterval(interval);
    };
}

export function view(model: Model, message: (m: Message) => void) {
    return (
        <>
            <p style={{
                display: 'flex',
                justifyContent: 'end',
                paddingRight: '1em',
                color: (model.state.type === 'failedToSave' ? 'red' : 'grey')
            }}>
                {(() => {
                    switch (model.state.type) {
                        case 'clean':
                            return 'Saved';

                        case 'failedToSave':
                            return 'Failed to save';

                        default:
                            return 'Not saved';
                    }
                })()}
            </p>

            <label htmlFor='firstName'>First name: </label>

            <input
                id='firstName'
                type='text'
                value={model.firstName}

                onChange={e => message({
                    type: 'firstNameEdited',
                    value: e.target.value
                })}
            ></input>

            <label htmlFor='lastName'>Last name: </label>

            <input
                id='lastName'
                type='text'
                value={model.lastName}

                onChange={e => message({
                    type: 'lastNameEdited',
                    value: e.target.value
                })}
            ></input>
        </>
    );
}

export default function Debounce() {
    const [model, message] = useElm(
        init(),
        update,
        execute,
        subscribe
    );

    return view(model, message);
}
