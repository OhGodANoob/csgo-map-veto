import React from 'react';
import { waitForElementToBeRemoved, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRedux } from 'test/render-with-redux';
import { VetosProvider } from 'renderer/vetos/vetos-context';
import { VetosResponse, VetoResponse } from 'renderer/types/api';
import { TeamNumbers } from 'renderer/types/team-number';
import { VoteTypes } from 'renderer/types/vote-type';
import { BestOfType } from 'renderer/types/best-of';
import { Vetos } from '../vetos';

const veto1: VetoResponse = {
  id: 1,
  created_at: new Date('September 10, 1990'),
  best_of: 3 as BestOfType,
  team_one_name: 'Hi',
  team_two_name: 'There',
  votes: [
    {
      id: 1,
      team_number: TeamNumbers.TEAM1,
      type: VoteTypes.PICK,
      map_name: 'de_test',
    },
    {
      id: 2,
      team_number: TeamNumbers.TEAM2,
      type: VoteTypes.BAN,
      map_name: 'de_test_again',
    },
  ],
};

const veto2: VetoResponse = {
  id: 2,
  created_at: new Date('November 22, 2018'),
  best_of: 1 as BestOfType,
  team_one_name: 'Toto',
  team_two_name: 'Tata',
  votes: [
    {
      id: 1,
      team_number: TeamNumbers.SERVER,
      type: VoteTypes.RANDOM,
      map_name: 'de_test_hi',
    },
  ],
};

describe('Vetos', () => {
  const renderComponent = () => {
    return renderWithRedux(
      <VetosProvider>
        <Vetos />
      </VetosProvider>
    );
  };

  const response: VetosResponse = [veto1, veto2];

  it('should fetch and render the vetos', async () => {
    global.fetch = jest.fn().mockImplementation(() => {
      return {
        json: () => {
          return Promise.resolve(response);
        },
      };
    });

    const { getByText, findAllByText, getByAltText } = renderComponent();

    await waitForElementToBeRemoved(() => getByText(/loading/i));

    await waitFor(async () => {
      expect(getByText('BO3')).toBeTruthy();
      expect(await findAllByText(veto1.team_one_name)).toHaveLength(2);
      expect(await findAllByText(veto1.team_two_name)).toHaveLength(2);
      expect(getByText('09/10/1990')).toBeTruthy();
      veto1.votes.forEach((vote) => {
        expect(getByAltText(vote.map_name)).toBeTruthy();
      });

      expect(getByText('BO1')).toBeTruthy();
      expect(await findAllByText(veto2.team_one_name)).toHaveLength(1);
      expect(await findAllByText(veto2.team_two_name)).toHaveLength(1);
      expect(await findAllByText('SERVER')).toHaveLength(1);
      expect(getByText('11/22/2018')).toBeTruthy();
      veto2.votes.forEach((vote) => {
        expect(getByAltText(vote.map_name)).toBeTruthy();
      });

      expect(await findAllByText('banned')).toHaveLength(1);
      expect(await findAllByText('picked')).toHaveLength(2);
      expect(await findAllByText(/delete/i)).toHaveLength(2);
    });
  });

  it('should render a loading message', async () => {
    global.fetch = jest.fn().mockImplementation(() => {
      return {
        json: () => {
          return new Promise((res) => setTimeout(res, 10000));
        },
      };
    });

    const { getByText } = renderComponent();

    await waitFor(() => expect(getByText(/loading/i)).toBeTruthy());
  });

  it('should render an error message', () => {
    global.fetch = jest.fn().mockImplementation(() => {
      throw new Error('nop');
    });

    const { getByText } = renderComponent();

    expect(getByText('nop')).toBeTruthy();
    expect(getByText('Make sure the database is running and the endpoint is correct in the settings!')).toBeTruthy();
  });

  it('should delete a veto', async () => {
    global.fetch = jest.fn().mockImplementation(() => {
      return {
        json: () => {
          return Promise.resolve([veto2]);
        },
      };
    });

    const { getByText, getByTestId } = renderComponent();

    await waitForElementToBeRemoved(() => getByText(/loading/i));

    global.fetch = jest.fn().mockImplementation(() => {
      return {
        status: 200,
      };
    });

    fireEvent.click(getByText(/delete/i));

    await waitForElementToBeRemoved(() => getByTestId('veto-2'));
  });
});
