'use client'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button, Input, Tooltip, Modal, Popover, Skeleton, message, Image as AntdImage } from "antd";
import { PictureOutlined, ClearOutlined, FieldTimeOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Square } from '@icon-park/react';
import Eraser from '@/app/images/eraser.svg'
import CloseIcon from '@/app/images/close.svg'
import { useRouter } from 'next/navigation'
import ChatHeader from '@/app/components/ChatHeader';
import ResponsingMessage from '@/app/components/ResponsingMessage';
import HistorySettings from '@/app/components/HistorySettings';
import MessageItem from '@/app/components/MessageItem';
import MarkdownRender from '@/app/components/Markdown';
import useChat from '@/app/hooks/chat/useChat';
import useImageUpload from '@/app/hooks/chat/useImageUpload';
import useRouteState from '../hooks/chat/useRouteState';
import useChatListStore from '@/app/store/chatList';
import { fileToBase64 } from '@/app/utils';
import { throttle } from 'lodash';
import { getMessagesInServer } from '@/app/chat/actions/message';
import { Message } from '@/app/db/schema';
import { useTranslations } from 'next-intl';

export const MessageList = (props: { chat_id: string }) => {
  const t = useTranslations('Chat');
  const [modal, contextHolder] = Modal.useModal();
  const messageListRef = useRef<HTMLDivElement>(null);
  const [historySettingOpen, SetHistorySettingOpen] = useState(false);
  const {
    input,
    chat,
    messageList,
    responseStatus,
    responseMessage,
    historyType,
    historyCount,
    isUserScrolling,
    currentModel,
    isPending,
    handleInputChange,
    clearHistory,
    handleSubmit,
    sendMessage,
    deleteMessage,
    addBreak,
    retryMessage,
    stopChat,
    setIsUserScrolling,
    shouldSetNewTitle,
  } = useChat(props.chat_id);

  const { uploadedImages, maxImages, handleImageUpload, removeImage, setUploadedImages } = useImageUpload();

  const isFromHome = useRouteState();
  const router = useRouter();
  const shouldSetNewTitleRef = useRef(shouldSetNewTitle);
  useEffect(() => {
    const check = async () => {
      if (isFromHome) {
        let existMessages: Message[] = [];
        const result = await getMessagesInServer(props.chat_id);
        if (result.status === 'success') {
          existMessages = result.data as Message[]
        }
        if (existMessages.length === 1 && existMessages[0]['role'] === 'user') {
          const question = existMessages[0]['content'];
          const messages = [{
            role: 'user' as const,
            content: question
          }];
          await sendMessage(messages);
          shouldSetNewTitleRef.current(messages);
          router.replace(`/chat/${props.chat_id}`);
        }
      }
    }
    check();
  }, [isFromHome, props.chat_id, sendMessage, router]);

  const handleHistorySettingOpenChange = (open: boolean) => {
    SetHistorySettingOpen(open);
  };

  const handleClearHistory = (): void => {
    modal.confirm({
      title: t('confirmClearHistoryMessage'),
      content: t('clearHistoryMessageNotice'),
      okText: t('confirm'),
      cancelText: t('cancel'),
      onOk() {
        clearHistory();
      },
      onCancel() { },
    });
  }

  useEffect(() => {
    if (!isUserScrolling) {
      const scrollToBottom = () => {
        if (messageListRef.current) {
          try {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
          } catch (error) {
            console.error('Scroll error:', error);
          }
        }
      };

      requestAnimationFrame(scrollToBottom);
    }
  }, [responseMessage, isUserScrolling]);

  const handleScroll = useCallback(() => {
    const chatElement = messageListRef.current;
    if (!chatElement) return;

    try {
      const isNearBottom = chatElement.scrollHeight - chatElement.scrollTop <= chatElement.clientHeight + 20;
      setIsUserScrolling(!isNearBottom);
    } catch (error) {
      console.error('Scroll calculation error:', error);
    }
  }, [setIsUserScrolling]);

  const throttledHandleScroll = useMemo(
    () => throttle(handleScroll, 100, { leading: true, trailing: true }),
    [handleScroll]
  );
  useEffect(() => {
    return () => {
      throttledHandleScroll.cancel();
    };
  }, [throttledHandleScroll]);

  return (
    <>
      {contextHolder}
      <ChatHeader />
      <div onScroll={throttledHandleScroll} ref={messageListRef} className='flex w-full flex-col h-0 px-4 grow py-6 relative overflow-y-auto leading-7 chat-list text-sm'>
        {!isPending && chat?.prompt && <div className="flex container mx-auto max-w-screen-md mb-4 w-full flex-col justify-center items-center">
          <div className='flex max-w-3xl text-justify w-full my-0 pt-0 pb-1 flex-col pr-4 pl-4'>
            <div className='flex flex-row items-center mb-2'>
              <span className='text-2xl leading-8'>✨</span>
              <span className='text-sm leading-8 ml-1 font-medium'>{t('prompt')}</span>
            </div>
            <div className='w-fit p-6 markdown-body !min-w-4 !bg-gray-100 text-base rounded-xl ml-10'>
              <MarkdownRender content={chat.prompt} />
            </div>
          </div>
        </div>}
        {isPending ?
          <div className="flex container px-4 mx-auto max-w-screen-md w-full flex-col justify-center items-center" >
            <div className='items-start mb-8 flex max-w-3xl w-full flex-row-reverse pl-4'>
              <div className='flex ml-10 flex-col mt-4 items-end'>
                <Skeleton active title={false} paragraph={{ rows: 2, width: 400 }} />
              </div>
            </div>
            <Skeleton avatar={{ size: 'default' }} active title={false} paragraph={{ rows: 4, width: ['60%', '60%', '100%', '100%'] }} />
          </div> :
          messageList.map((item, index) => {
            return (
              <MessageItem
                key={index}
                role={item.role as 'assistant' | 'user' | 'system'}
                item={item}
                index={index}
                retryMessage={retryMessage}
                deleteMessage={deleteMessage}
              />
            )
          })
        }
        <ResponsingMessage
          responseStatus={responseStatus}
          responseMessage={responseMessage}
          currentProvider={currentModel.provider.id}
        />
      </div>
      {uploadedImages.length > 0 && <div className="h-24 flex flex-col bg-gray-50 justify-center items-center">
        <div className='flex flex-row h-16 max-w-3xl pl-2 w-full'>
          {uploadedImages.map((image, index) => (
            <div key={index} className="relative group mr-4 h-16 w-16">
              <AntdImage alt=''
                className='block border h-full w-full rounded-md object-cover cursor-pointer'
                height={64}
                width={64}
                src={image.url}
                preview={{
                  mask: false
                }}
              />
              <div
                className="absolute bg-white rounded-full -top-2 -right-2 cursor-pointer hidden group-hover:block"
                onClick={() => removeImage(index)}
              >
                <CloseIcon className='w-5 h-5' alt='close' />
              </div>
            </div>
          ))}
        </div>
      </div>}
      <div className="h-32 flex flex-col bg-white border-t  justify-center items-center pt-0 p-4">
        <div className='flex flex-row justify-between h-10 max-w-3xl w-full relative p-2'>
          <div className='flex flex-row'>
            {currentModel.supportVision && <Tooltip title={t('image')}>
              <Button type="text" size='small' onClick={() => handleImageUpload()}>
                <PictureOutlined style={{ color: 'gray' }} />
                <span className='text-xs -ml-1 text-gray-500'>{t('image')}</span>
              </Button>
            </Tooltip>}

            {!currentModel.supportVision && <Tooltip title={t('unsupportImage')}>
              <Button type="text" size='small' disabled>
                <PictureOutlined style={{ color: '#ddd' }} />
                <span className='text-xs -ml-1 text-gray-300'>{t('image')}</span>
              </Button>
            </Tooltip>}

            <Popover
              content={<HistorySettings chat_id={props.chat_id} changeVisible={handleHistorySettingOpenChange} />}
              title={t('historyMessageCount')}
              trigger="click"
              open={historySettingOpen}
              onOpenChange={handleHistorySettingOpenChange}
            >
              <Tooltip title={t('historyMessageCount')} placement='bottom' arrow={false}>
                <Button className='ml-2' type="text" size='small'><FieldTimeOutlined style={{ color: 'gray' }} />
                  <span className='text-xs -ml-1 text-gray-500'>
                    {historyType === 'all' && <>{t('historyMessageCountAllShot')}</>}
                    {historyType === 'none' && <>{t('historyMessageCountNone')}</>}
                    {historyType === 'count' && <>{historyCount} {t('piece')}</>}
                  </span>
                </Button>
              </Tooltip>
            </Popover>
            <Button type="text" size='small' onClick={() => {
              addBreak();
              setTimeout(() => {
                if (messageListRef.current) {
                  messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
                }
              }, 10);
            }}>
              <Eraser alt="Eraser" width="15" height="15" />
              <span className='text-xs -ml-1 text-gray-500'>{t('clearMemory')}</span>
            </Button>
          </div>
          <div className='flex flex-row'>
            <Tooltip title={t('clearHistoryMessage')}>
              <Button onClick={() => {
                handleClearHistory()
              }} className='ml-2' type="text" size='small'><ClearOutlined style={{ color: 'gray' }} /></Button>
            </Tooltip>
          </div>
        </div>
        <div className='flex h-full max-w-3xl w-full relative pl-2 pr-2'>
          <Input.TextArea
            onChange={handleInputChange}
            value={input}
            autoFocus={true}
            onPaste={async (e) => {
              // 阻止默认粘贴行为
              if (e.clipboardData.files.length > 0) {
                e.preventDefault();

                const files = Array.from(e.clipboardData.files);
                // 检查是否为图片文件
                const imageFiles = files.filter(file => file.type.startsWith('image/'));

                if (imageFiles.length > 0) {
                  if (!currentModel.supportVision) {
                    message.warning(t('notSupportVision'));
                    return;
                  }
                  if (uploadedImages.length + imageFiles.length > maxImages) {
                    message.warning(t('maxImageCount', { maxImages: maxImages }));
                    return;
                  }
                  // 调用已有的图片上传处理函数
                  for (const file of imageFiles) {
                    const url = URL.createObjectURL(file);
                    // 使用已有的 uploadedImages 状态更新函数
                    handleImageUpload(file, url);
                  }
                }
              }
            }}
            onKeyDown={async (e) => {
              // 如果是在输入法编辑状态，直接返回，不做处理
              if (e.nativeEvent.isComposing) {
                return;
              }
              if (e.key === 'Enter') {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                  // Command/Ctrl + Enter: 插入换行
                  e.preventDefault();
                  const target = e.currentTarget;
                  const start = target.selectionStart;
                  const end = target.selectionEnd;
                  const newValue = target.value.substring(0, start) + '\n' + target.value.substring(end);

                  // 创建一个合成事件来更新输入
                  handleInputChange({
                    target: { value: newValue }
                  } as React.ChangeEvent<HTMLTextAreaElement>);

                  // 下一个事件循环设置光标位置
                  setTimeout(() => {
                    target.selectionStart = target.selectionEnd = start + 1;
                  }, 0);
                  return;
                }
                e.preventDefault();
                if (input.trim() === '') {
                  return;
                }
                if (responseStatus === 'pending') {
                  return;
                }

                let messageContent;
                if (uploadedImages.length > 0) {
                  const imageMessages = await Promise.all(uploadedImages
                    .filter(img => img.file)
                    .map(async (img) => ({
                      type: 'image' as const,
                      mimeType: img.file.type,
                      data: await fileToBase64(img.file!)
                    })));
                  messageContent = [
                    {
                      type: 'text' as const,
                      text: input
                    },
                    ...imageMessages
                  ];
                } else {
                  messageContent = input;
                }
                handleSubmit(messageContent).then(() => {
                  setTimeout(() => {
                    if (messageListRef.current) {
                      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
                    }
                  }, 10);
                  setUploadedImages([]);
                });
              }
            }}
            placeholder="发送消息"
            className='scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-300 scrollbar-track-gray-100 scrollbar-rou'
            style={{ paddingRight: '5em', resize: 'none', scrollbarColor: '#eaeaea transparent' }}
          />
          {responseStatus === 'done' && <Button
            type="primary"
            size='small'
            style={{ position: 'absolute' }}
            className='absolute right-4 bottom-2'
            shape="circle"
            onClick={async () => {
              if (input.trim() === '') {
                return;
              }
              let messageContent;
              if (uploadedImages.length > 0) {
                const imageMessages = await Promise.all(uploadedImages
                  .filter(img => img.file)
                  .map(async (img) => ({
                    type: 'image' as const,
                    mimeType: img.file.type,
                    data: await fileToBase64(img.file!)
                  })));
                messageContent = [
                  {
                    type: 'text' as const,
                    text: input
                  },
                  ...imageMessages
                ];
              } else {
                messageContent = input;
              }
              handleSubmit(messageContent).then(() => {
                setUploadedImages([]);
              });
            }}
            icon={<ArrowUpOutlined />} />
          }
          {responseStatus === 'pending' && <Button
            type="primary"
            size='small'
            style={{ position: 'absolute' }}
            className='absolute right-4 bottom-2'
            shape="circle"
            onClick={() => {
              stopChat()
            }}
            icon={<Square theme="filled" size="12" fill="#ffffff" />} />
          }
        </div>
      </div>
    </>
  );
}
