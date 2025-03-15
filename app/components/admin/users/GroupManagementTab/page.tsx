'use client';
import React, { useEffect, useMemo, useState } from 'react'
import { getGroupList, addGroup, deleteGroup, updateGroup } from './actions';
import { Tag, Button, Modal, Form, Input, Divider, message, Skeleton, Select, Radio, Avatar, Tooltip, Popconfirm, FormInstance } from 'antd';
import { useTranslations } from 'next-intl';
import useModelListStore from '@/app/store/modelList';
import { fetchAvailableLlmModels } from '@/app/adapter/actions';

type FormValues = {
    id: string;
    name: string;
    models: number[];
    modelType: 'all' | 'specific';
}

export interface groupType {
    isDefault: any;
    name: string;
    models: number[];
    modelType?: 'all' | 'specific';
    id?: string;
    modelProviderList?: string[];
}

const GroupModal = ({ title, open, onOk, onCancel, onFinish, form, initialValues, options, tagRender }: {
    title: string;
    open: boolean;
    onOk: () => void;
    onCancel: () => void;
    onFinish: (values: FormValues) => void;
    form: FormInstance;
    initialValues?: any;
    options?: any;
    tagRender?: any;
}) => {
    const t = useTranslations('Admin.Users');
    const ct = useTranslations('Common');
    return (
        <Modal title={title} open={open} onOk={onOk} onCancel={onCancel}>
            <Form
                layout="vertical"
                form={form}
                onFinish={onFinish}
                validateTrigger="onBlur"
                initialValues={{ modelType: 'all', ...initialValues }}
            >
                <Form.Item name="id" hidden>
                    <Input type="hidden" />
                </Form.Item>
                <Form.Item label={<span className='font-medium'>{t('groupName')}</span>} name='name'
                    rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item label={<span className='font-medium'>{t('availableModels')}
                </span>} name='modelType'>
                    <Radio.Group>
                        <Radio value="all">{ct('all')}</Radio>
                        <Radio value="specific">{t('specificModel')}</Radio>
                    </Radio.Group>
                </Form.Item>

                <Form.Item
                    noStyle
                    shouldUpdate={(prev, cur) => prev.modelType !== cur.modelType}
                >
                    {({ getFieldValue }) => {
                        return getFieldValue('modelType') === 'specific' && (
                            <Form.Item
                                name="models"
                                style={{ margin: 0 }}
                            >
                                <Select
                                    mode="multiple"
                                    placeholder="请选择模型"
                                    style={{ backgroundColor: 'transparent' }}
                                    listHeight={320}
                                    options={options}
                                    tagRender={tagRender}
                                />
                            </Form.Item>
                        );
                    }}
                </Form.Item>
            </Form>
        </Modal>
    )
};

const groupManagementTab = () => {
    const t = useTranslations('Admin.Users');
    const ct = useTranslations('Common');
    const { modelListRealId, providerList, initModelListRealId } = useModelListStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    const [groupList, setGroupList] = useState<groupType[]>([]);
    const [userFetchStatus, setUserFetchStatus] = useState(true);
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();
    const showAddUserModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {
        form.submit();
    };

    const handleEditGroupOk = () => {
        editForm.submit();
    };

    const handleCancel = () => {
        form.resetFields();
        setIsModalOpen(false);
    };

    const handleEditUserModalCancel: () => void = () => {
        editForm.resetFields();
        setIsEditUserModalOpen(false);
    };

    useEffect(() => {
        const fetchGroupList = async (): Promise<void> => {
            const groupList = await getGroupList();
            setGroupList(groupList);
            setUserFetchStatus(false)
        };
        fetchGroupList();
    }, []);

    useEffect(() => {
        const initializeModelList = async () => {
            const remoteModelList = await fetchAvailableLlmModels(false);
            await initModelListRealId(remoteModelList);
        };
        initializeModelList();
    }, []);


    const onFinish = async (values: FormValues) => {
        const result = await addGroup(values);
        if (result.success) {
            const groupList = await getGroupList();
            setGroupList(groupList);
            message.success(t('addUserSuccess'));
            form.resetFields();
            setIsModalOpen(false);
        } else {
            message.error(result.message)
        }
    };

    const onEditGroupFinish = async (values: FormValues) => {
        const result = await updateGroup(values.id, values);
        if (result.success) {
            const groupList = await getGroupList();
            setGroupList(groupList);
            message.success(t('updateUserSuccess'));
            editForm.resetFields();
            setIsEditUserModalOpen(false);
        } else {
            message.error(result.message)
        }
    };


    const handleEditGroup = async (group: groupType) => {
        editForm.setFieldsValue(group)
        setIsEditUserModalOpen(true);
    }

    const handleDeleteGroup = async (id: string) => {
        const result = await deleteGroup(id);
        if (result.success) {
            const groupList = await getGroupList();
            setGroupList(groupList);
            message.success(t('deleteGroupSuccess'));
        } else {
            message.error(result.message)
        }
    }
    const options = useMemo(() => providerList.map((provider) => {
        return {
            label: <span key={`provider-${provider.id}`}>{provider.providerName}</span>,
            title: provider.providerName,
            value: provider.id,
            options: modelListRealId.filter((model) => model.provider.id === provider.id && model.selected).map((model) => ({
                label: (<div className='flex flex-row items-center' key={`model-${model.id}`}>
                    {model.provider.providerLogo ?
                        <Avatar
                            size={20}
                            src={model.provider.providerLogo}
                            key={`avatar-${model.id}`}
                        />
                        :
                        <Avatar
                            size={20}
                            style={{ backgroundColor: '#1c78fa' }}
                            key={`avatar-${model.id}`}

                        >{model.provider.providerName.charAt(0)}</Avatar>
                    }

                    < span className='ml-1' > {model.provider.providerName} | {model.displayName}</span >
                </div >),
                value: model.id,
            }))
        }
    }), [modelListRealId, providerList]);

    const tagRender = (props: any) => {
        const { label, value, closable, onClose } = props;
        const option = modelListRealId.find(model => model.id === value);
        return (
            <Tag
                color="#f2f2f2"
                style={{ margin: '5px', color: '#626262' }}
                key={value}
                bordered={false}
                closable={closable}
                onClose={onClose}
                closeIcon={<span style={{ color: '#7e7e7e', fontSize: 16 }}>×</span>}
            >
                {option?.provider?.providerName || ''} | {option?.displayName || ''}
            </Tag>
        )
    }

    return (
        <div className='container max-w-4xl mb-6 px-4 md:px-0 pt-4'>
            <div className='w-full mb-6 flex flex-row justify-between items-center'>
                <p className='text-sm text-gray-500'>{t('groupManagementTip')}</p>
                <Button type='primary' onClick={showAddUserModal}>{t('addGroup')}</Button>
            </div>
            {userFetchStatus ? <><Skeleton active /></> :
                <><div className="overflow-hidden rounded-lg border border-slate-300">
                    <table className='border-collapse w-full'>
                        <thead>
                            <tr className="bg-slate-100">
                                <th className='border-b border-r border-slate-300 w-1/4'>{t('groupName')}</th>
                                <th className='border-b border-r border-slate-300 w-1/2'>{t('availableModels')}
                                </th>
                                <th className='border-b border-slate-300 p-2 w-1/5'>{t('action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupList.map((group, index) => (
                                <tr key={group.id} className="hover:bg-slate-50">
                                    <td className='border-t border-r text-sm border-slate-300 p-2'>{group.isDefault ? t('defaultGroup') : group.name}</td>
                                    <td className='border-t border-r text-sm border-slate-300 p-2'>
                                        {group.modelType === 'specific' ? group.modelProviderList && group.modelProviderList.map((model, index) => (
                                            <Tag color='#f2f2f2' style={{ marginBottom: 10, color: '#626262' }} key={index} bordered={false}>{model}</Tag>
                                        )) : <Tag color='blue'>{ct('all')}</Tag>}
                                    </td>
                                    <td className='border-t text-center text-sm w-32 border-slate-300 p-2'>
                                        <Button
                                            size='small'
                                            className='text-sm'
                                            type='link'
                                            onClick={() => {
                                                handleEditGroup(group)
                                            }}
                                        >{t('edit')}</Button>
                                        <Divider type="vertical" />
                                        {group.isDefault ? (
                                            <Tooltip title={t('defaultGroupCannotDelete')}>
                                                <Button
                                                    size='small'
                                                    className='text-sm'
                                                    type='link'
                                                    disabled
                                                >{t('delete')}</Button>
                                            </Tooltip>
                                        ) : (
                                            <Popconfirm
                                                title={t('deleteConfirmTitle')}
                                                description=<div style={{ width: 260 }}>{t('deleteConfirmContent')}</div>
                                                onConfirm={() => handleDeleteGroup(group.id as string)}
                                            >
                                                <Button
                                                    size='small'
                                                    className='text-sm'
                                                    type='link'
                                                >{t('delete')}</Button>
                                            </Popconfirm>
                                        )}
                                    </td>
                                </tr>
                            ))}

                        </tbody>
                    </table>
                </div>
                    <div className='h-8'></div>
                </>
            }
            <GroupModal
                title={t('addGroup')}
                open={isModalOpen}
                onOk={handleOk}
                onFinish={onFinish}
                onCancel={handleCancel}
                form={form}
                options={options}
                tagRender={tagRender}
            />
            <GroupModal
                title={ct('edit')}
                open={isEditUserModalOpen}
                onOk={handleEditGroupOk}
                onFinish={onEditGroupFinish}
                onCancel={handleEditUserModalCancel}
                form={editForm}
                options={options}
                tagRender={tagRender}
            />
        </div>
    );
};

export default groupManagementTab;