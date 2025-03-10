import React from 'react';
import MarkdownRender from '@/app/components/Markdown';
import { Avatar } from "antd";
import { ResponseContent } from '@/app/adapter/interface';
import DotsLoading from '@/app/components/loading/DotsLoading';
import BallsLoading from '@/app/components/loading/BallsLoading';
import ThinkingIcon from '@/app/images/thinking.svg';
import useModelListStore from '@/app/store/modelList';
import { useTranslations } from 'next-intl';

const ResponsingMessage = (props: {
  responseStatus: string,
  responseMessage: ResponseContent,
  currentProvider: string,
}) => {
  const { allProviderListByKey } = useModelListStore();
  const t = useTranslations('Chat');
  return (
    <>
      {props.responseStatus === "pending" &&
        <div className="flex container mx-auto px-4 max-w-screen-md w-full flex-col justify-center items-center" >
          <div className='items-start flex max-w-3xl text-justify w-full my-0 pt-0 pb-1 flex-row'>
            {allProviderListByKey && allProviderListByKey[props.currentProvider]?.providerLogo ?
              <Avatar
                style={{ marginTop: '0.2rem', 'fontSize': '24px', 'border': '1px solid #eee', 'padding': '2px' }}
                src={allProviderListByKey[props.currentProvider].providerLogo}
              />
              :
              <div className='bg-blue-500 flex mt-1 text-cyan-50 items-center justify-center rounded-full w-8 h-8'>
                {allProviderListByKey && allProviderListByKey[props.currentProvider].providerName.charAt(0)}</div>
            }
            <div className='flex flex-col w-0 grow'>
              <div className='px-3 py-2 ml-2  bg-gray-100  text-gray-600 w-full grow markdown-body answer-content rounded-xl'>
                {
                  (props.responseMessage.content === "" && props.responseMessage.reasoning_content === "") &&
                  <DotsLoading />
                }
                {props.responseMessage.reasoning_content &&
                  <div className='text-sm mb-4'>
                    <div className='flex text-xs flex-row items-center text-gray-800 bg-gray-100 rounded-md p-2'>
                      <ThinkingIcon width={16} height={16} style={{ 'fontSize': '10px' }} />
                      {props.responseMessage.content ? <span className='ml-1'>{t('thought')}</span>
                        : <span className='ml-1'>{t('thinking')}</span>
                      }
                    </div>
                    <div className='border-l-2 border-gray-200 px-2 mt-2 leading-5 text-gray-400'>
                      <MarkdownRender content={props.responseMessage.reasoning_content as string} />
                    </div>
                  </div>}
                <MarkdownRender content={props.responseMessage.content} />
              </div>
              {(props.responseMessage.content !== "" || props.responseMessage.reasoning_content !== "") &&
                <div className='px-3'>
                  <BallsLoading />
                </div>
              }
            </div>
          </div>
        </div>
      }
    </>
  )
}

export default ResponsingMessage