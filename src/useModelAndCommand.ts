import React, { useEffect, useReducer } from 'react';

export const None: BaseCommand = { type: 'none' };
export type BaseCommand = { type: string };

const kCommand = Symbol('kCommand');

export function useModelAndCommand<
    Model, 
    Message,
    Command extends BaseCommand
>(
    update: (model: Model, message: Message) => [Model, Command],
    execute: (command: Command, message: (m: Message) => void) => void,
    initialState: [Model, Command]
): [Model, React.Dispatch<Message>] {
    const [internal, message] = useReducer(
        (model: InternalModel<Model, Command>, message: Message) => {
            return toInternal(update(model, message));
        },

        toInternal(initialState)
    );

    useEffect(() => {
        execute( internal[kCommand], message);
    }, [internal[kCommand]]);

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
