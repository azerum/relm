import React, { useEffect, useReducer } from 'react';

export type BaseCommand = { type: string };

const kCommand = Symbol('kCommand');

export function useElm<
    Model, 
    Message,
    Command extends BaseCommand
>(
    initialState: [Model, Command],
    update: (model: Model, message: Message) => [Model, Command],
    execute: (command: Command, message: (m: Message) => void) => void,
    subscribe?: (message: (m: Message) => void) => () => void
): [Model, React.Dispatch<Message>] {
    const [internal, message] = useReducer(
        (model: InternalModel<Model, Command>, message: Message) => {
            return toInternal(update(model, message));
        },

        toInternal(initialState)
    );

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        execute(internal[kCommand], message);
    }, [internal[kCommand]]);
    /* eslint-enable */

    useEffect(() => {
        if (subscribe) {
            return subscribe(message);
        }
    });

    return [internal, message];
}

type InternalModel<Model, Command extends BaseCommand> = Model & {
    [kCommand]: Command;
};

function toInternal<Model, Command extends BaseCommand>(
    pair: [Model, Command]
): InternalModel<Model, Command> {
    const [model, command] = pair;

    return {
        ...model,
        [kCommand]: command
    };
} 
