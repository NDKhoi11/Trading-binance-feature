import { Tab } from '@headlessui/react';
import React from 'react';

const ComponentA = () => {
  return (
    <div style={{ width: '500px' }}>
      <video src="/dummy_video.mp4" controls width={"100%"} />
    </div>
  )
}
const MyTab = () => {
  const componentState = React.useMemo(() => {return <ComponentA />}, []);
  const [mode, setMode] = React.useState(true);
  console.log(componentState)

  const handleClick = () => {
    setMode(!mode);
  }
  return (
    <>
      
      {mode && componentState}
      <button onClick={handleClick}>aaa</button>
      <Tab.Group>
        <Tab.List>
          <Tab onClick={() => console.log('aaa')}>Tab 1</Tab>
          <Tab>Tab 2</Tab>
          <Tab>Tab 3</Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>Content 1</Tab.Panel>
          <Tab.Panel>Content 2</Tab.Panel>
          <Tab.Panel>Content 3</Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
      {!mode && componentState}
    </>
  )
};

export default MyTab;
